/* Firestore security rules tests for AI Pathshala Apps (teacher accounts + Live Class Quiz).
 *
 * Needs the Firestore emulator (which needs Java 11+). From the firebase/ folder:
 *   npm install
 *   npx firebase emulators:exec --only firestore "npm test"      (or: npm run test:emulator)
 * or, with emulators already running (npm run emulators):  npm test
 *
 * Every allow AND deny case of firestore.rules is covered, including attacks: a student writing their own
 * score, reading the answer key or other students' answers, answering twice / a non-current question,
 * joining a locked/ended session or after being removed, impersonating another uid, taking a nickname,
 * enumerating sessions, and a teacher reading another teacher's quizzes or sessions.
 * Tests marked "ATTACK (fixed)" cover the holes closed in the security review (firebase/SECURITY_REVIEW.md):
 * look-alike / invisible-character nicknames, nickname squatting, reading other students' nickname
 * reservations, and reading ended or forgotten sessions by guessing codes.
 * The "Stay updated" list (interest/{uid}) is tested last: create only, one sign-up per account, exact shape, and no
 * reads, lists, changes or deletes for anyone. Then the public sign-up counter stats/signups: anyone may read the
 * number; it goes up by exactly 1, and only in the same batch as a NEW sign-up of the writer's own account. */
'use strict';
const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, writeBatch,
  serverTimestamp, Timestamp, arrayUnion, runTransaction, increment
} = require('firebase/firestore');

const PROJECT = 'demo-apni-pathshala';
const DAY = 86400000;
const [HOST, PORT] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');

let env;
const in30d = () => Timestamp.fromMillis(Date.now() + 30 * DAY);
const teacher = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'google.com' }, name: 'Teacher ' + uid, email: uid + '@example.com' }).firestore();
const student = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const nobody = () => env.unauthenticatedContext().firestore();

/* ------------------------------------------------------------------ fixtures
   Teacher tA owns quiz qA and sessions 123456 (question 0 open), 222222 (locked lobby), 333333 (ended).
   Teacher tB is another teacher. Student s1 "Asha" has joined 123456. Student kid9 was removed from it. */
const QUESTIONS = [{ q: '2+2?', options: ['3', '4', '5', '6'], time: 20 }, { q: 'Capital of India?', options: ['Delhi', 'Mumbai', 'Pune'], time: 20 }];
function sessionDoc(owner, over) {
  return Object.assign({
    owner, title: 'Maths quiz', lang: 'en', state: 'lobby', current: -1, questionStartedAt: null, starts: {},
    timePerQ: 20, locked: false, createdAt: serverTimestamp(), expireAt: in30d(), questions: QUESTIONS,
    reveal: null, playerCount: 0, kicked: [], quizId: null
  }, over || {});
}
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const now = Timestamp.now();
    await setDoc(doc(db, 'teachers/tA'), { name: 'Teacher A', createdAt: now, plan: 'free' });
    await setDoc(doc(db, 'teachers/tB'), { name: 'Teacher B', createdAt: now, plan: 'free' });
    await setDoc(doc(db, 'quizzes/qA'), { owner: 'tA', title: 'Maths', questions: [{ q: '2+2?', options: ['3', '4'], correct: 1 }], lang: 'en', createdAt: now, updatedAt: now });
    await setDoc(doc(db, 'quizzes/qB'), { owner: 'tB', title: 'Science', questions: [{ q: 'H2O?', options: ['water', 'salt'], correct: 0 }], lang: 'en', createdAt: now, updatedAt: now });
    await setDoc(doc(db, 'sessions/123456'), sessionDoc('tA', { state: 'question', current: 0, questionStartedAt: now, starts: { 0: now }, createdAt: now, kicked: ['kid9'] }));
    await setDoc(doc(db, 'sessions/123456/private/key'), { owner: 'tA', correct: [1, 0], explain: ['', ''], expireAt: in30d() });
    await setDoc(doc(db, 'sessions/123456/players/s1'), { name: 'Asha', score: 0, joinedAt: now, expireAt: in30d() });
    await setDoc(doc(db, 'sessions/123456/names/asha'), { uid: 's1', expireAt: in30d() });
    await setDoc(doc(db, 'sessions/123456/players/s2'), { name: 'Ravi', score: 0, joinedAt: now, expireAt: in30d() });
    await setDoc(doc(db, 'sessions/123456/names/ravi'), { uid: 's2', expireAt: in30d() });
    await setDoc(doc(db, 'sessions/123456/answers/s2_0'), { uid: 's2', i: 0, choice: 2, at: now, expireAt: in30d() });
    await setDoc(doc(db, 'sessions/222222'), sessionDoc('tA', { locked: true, createdAt: now }));
    await setDoc(doc(db, 'sessions/333333'), sessionDoc('tA', { state: 'ended', createdAt: now }));
    await setDoc(doc(db, 'sessions/444444'), sessionDoc('tB', { createdAt: now }));
  });
}
/* a student joins: player doc + nickname reservation in one batch (what cloud.js does) */
function join(db, code, uid, name, over, nameKey) {
  const b = writeBatch(db);
  b.set(doc(db, `sessions/${code}/names/${nameKey || name.toLowerCase()}`), { uid, expireAt: in30d() });
  b.set(doc(db, `sessions/${code}/players/${uid}`), Object.assign({ name, score: 0, joinedAt: serverTimestamp(), expireAt: in30d() }, over || {}));
  return b.commit();
}
function answer(db, code, uid, i, choice, over, id) {
  return setDoc(doc(db, `sessions/${code}/answers/${id || uid + '_' + i}`), Object.assign({ uid, i, choice, at: serverTimestamp(), expireAt: in30d() }, over || {}));
}

function reachable(host, port) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port: Number(port) }, () => { s.end(); resolve(true); });
    s.on('error', () => resolve(false));
    s.setTimeout(2000, () => { s.destroy(); resolve(false); });
  });
}

before(async () => {
  if (!(await reachable(HOST, PORT))) {
    throw new Error(`Firestore emulator not reachable at ${HOST}:${PORT}. Run: npx firebase emulators:exec --only firestore "npm test" (needs Java 11+).`);
  }
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'), host: HOST, port: Number(PORT) }
  });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await seed(); });

/* ================================================================== teachers/{uid} */
describe('teachers', () => {
  test('a teacher creates their own profile on the free plan', async () => {
    const db = teacher('tC');
    await assertSucceeds(setDoc(doc(db, 'teachers/tC'), { name: 'Teacher C', createdAt: serverTimestamp(), plan: 'free' }));
  });
  test('ATTACK: a teacher cannot give themselves another plan', async () => {
    await assertFails(setDoc(doc(teacher('tC'), 'teachers/tC'), { name: 'C', createdAt: serverTimestamp(), plan: 'pro' }));
  });
  test('ATTACK: a teacher cannot change plan later', async () => {
    await assertFails(updateDoc(doc(teacher('tA'), 'teachers/tA'), { plan: 'pro' }));
  });
  test('a teacher may rename their own profile', async () => {
    await assertSucceeds(updateDoc(doc(teacher('tA'), 'teachers/tA'), { name: 'Mrs A' }));
  });
  test('a teacher reads their own profile', async () => {
    await assertSucceeds(getDoc(doc(teacher('tA'), 'teachers/tA')));
  });
  test("ATTACK: a teacher cannot read another teacher's profile", async () => {
    await assertFails(getDoc(doc(teacher('tB'), 'teachers/tA')));
  });
  test('ATTACK: a teacher cannot create a profile for another uid', async () => {
    await assertFails(setDoc(doc(teacher('tC'), 'teachers/tD'), { name: 'D', createdAt: serverTimestamp(), plan: 'free' }));
  });
  test('ATTACK: an anonymous student cannot create a teacher profile', async () => {
    await assertFails(setDoc(doc(student('s9'), 'teachers/s9'), { name: 'x', createdAt: serverTimestamp(), plan: 'free' }));
  });
  test('nobody can list teachers', async () => {
    await assertFails(getDocs(collection(teacher('tA'), 'teachers')));
  });
  test('a teacher deletes their own profile', async () => {
    await assertSucceeds(deleteDoc(doc(teacher('tA'), 'teachers/tA')));
  });
  test('signed-out users can read nothing', async () => {
    await assertFails(getDoc(doc(nobody(), 'teachers/tA')));
  });
});

/* ================================================================== quizzes */
describe('quizzes', () => {
  const quiz = (owner, over) => Object.assign({ owner, title: 'New quiz', questions: [{ q: 'a', options: ['x', 'y'], correct: 0 }], lang: 'hi', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, over || {});
  test('a teacher creates their own quiz', async () => {
    await assertSucceeds(setDoc(doc(teacher('tA'), 'quizzes/new1'), quiz('tA')));
  });
  test('ATTACK: a teacher cannot create a quiz owned by someone else (impersonation)', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'quizzes/new2'), quiz('tB')));
  });
  test('ATTACK: an anonymous student cannot create quizzes', async () => {
    await assertFails(setDoc(doc(student('s1'), 'quizzes/new3'), quiz('s1')));
  });
  test('a quiz needs a title and 1-200 questions', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'quizzes/new4'), quiz('tA', { title: '' })));
    await assertFails(setDoc(doc(teacher('tA'), 'quizzes/new5'), quiz('tA', { questions: [] })));
  });
  test('a quiz cannot carry extra fields or a client-chosen createdAt', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'quizzes/new6'), quiz('tA', { public: true })));
    await assertFails(setDoc(doc(teacher('tA'), 'quizzes/new7'), quiz('tA', { createdAt: Timestamp.fromMillis(0) })));
  });
  test('a teacher reads their own quiz; a missing id reads as missing', async () => {
    await assertSucceeds(getDoc(doc(teacher('tA'), 'quizzes/qA')));
    await assertSucceeds(getDoc(doc(teacher('tA'), 'quizzes/doesNotExist')));
  });
  test("ATTACK: a teacher cannot read another teacher's quiz", async () => {
    await assertFails(getDoc(doc(teacher('tB'), 'quizzes/qA')));
  });
  test('a teacher lists only their own quizzes (where owner == uid)', async () => {
    const db = teacher('tA');
    await assertSucceeds(getDocs(query(collection(db, 'quizzes'), where('owner', '==', 'tA'))));
  });
  test("ATTACK: listing all quizzes or another teacher's quizzes is refused", async () => {
    const db = teacher('tA');
    await assertFails(getDocs(collection(db, 'quizzes')));
    await assertFails(getDocs(query(collection(db, 'quizzes'), where('owner', '==', 'tB'))));
  });
  test('a teacher updates their own quiz (updatedAt = server time)', async () => {
    await assertSucceeds(updateDoc(doc(teacher('tA'), 'quizzes/qA'), { title: 'Maths 2', updatedAt: serverTimestamp() }));
  });
  test('ATTACK: a teacher cannot hand a quiz to someone else or edit theirs', async () => {
    await assertFails(updateDoc(doc(teacher('tA'), 'quizzes/qA'), { owner: 'tB', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(teacher('tA'), 'quizzes/qB'), { title: 'mine now', updatedAt: serverTimestamp() }));
  });
  test("a teacher deletes their own quiz, not another teacher's", async () => {
    await assertSucceeds(deleteDoc(doc(teacher('tA'), 'quizzes/qA')));
    await assertFails(deleteDoc(doc(teacher('tA'), 'quizzes/qB')));
  });
});

/* ================================================================== sessions */
describe('sessions', () => {
  function createWithKey(db, code, owner, over) {
    return runTransaction(db, async (tx) => {
      const ref = doc(db, `sessions/${code}`);
      const snap = await tx.get(ref);
      if (snap.exists()) throw new Error('taken');
      tx.set(ref, sessionDoc(owner, over));
      tx.set(doc(db, `sessions/${code}/private/key`), { owner, correct: [1, 0], explain: ['', ''], expireAt: in30d() });
    });
  }
  test('a teacher creates a session + answer key in one transaction', async () => {
    await assertSucceeds(createWithKey(teacher('tA'), '555555', 'tA'));
  });
  test('ATTACK: a session code must be 6 digits', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'sessions/12345'), sessionDoc('tA')));
    await assertFails(setDoc(doc(teacher('tA'), 'sessions/abcdef'), sessionDoc('tA')));
  });
  test('ATTACK: a student cannot create a session', async () => {
    await assertFails(setDoc(doc(student('s1'), 'sessions/666666'), sessionDoc('s1')));
  });
  test('ATTACK: a new session must start in the lobby, unlocked, with nobody kicked', async () => {
    const db = teacher('tA');
    await assertFails(setDoc(doc(db, 'sessions/666661'), sessionDoc('tA', { state: 'question', current: 0 })));
    await assertFails(setDoc(doc(db, 'sessions/666662'), sessionDoc('tA', { locked: true })));
    await assertFails(setDoc(doc(db, 'sessions/666663'), sessionDoc('tA', { kicked: ['x'] })));
    await assertFails(setDoc(doc(db, 'sessions/666664'), sessionDoc('tA', { playerCount: 5 })));
  });
  test('ATTACK: expireAt must be about 30 days away (no data kept for a year)', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'sessions/666665'), sessionDoc('tA', { expireAt: Timestamp.fromMillis(Date.now() + 365 * DAY) })));
  });
  test('ATTACK: a teacher cannot create a session for another owner', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'sessions/666666'), sessionDoc('tB')));
  });
  test('ATTACK: an existing code cannot be taken over by another teacher', async () => {
    await assertFails(setDoc(doc(teacher('tB'), 'sessions/123456'), sessionDoc('tB')));
  });
  test('any signed-in user (student) can read a session by its code', async () => {
    await assertSucceeds(getDoc(doc(student('s5'), 'sessions/123456')));
  });
  test('ATTACK: signed-out users cannot read sessions', async () => {
    await assertFails(getDoc(doc(nobody(), 'sessions/123456')));
  });
  test('ATTACK: nobody can list (enumerate) all session codes', async () => {
    await assertFails(getDocs(collection(student('s5'), 'sessions')));
    await assertFails(getDocs(collection(teacher('tB'), 'sessions')));
  });
  test('a teacher lists only their own sessions', async () => {
    await assertSucceeds(getDocs(query(collection(teacher('tA'), 'sessions'), where('owner', '==', 'tA'))));
    await assertFails(getDocs(query(collection(teacher('tB'), 'sessions'), where('owner', '==', 'tA'))));
  });
  test('the owner moves the session on (start / reveal / lock / kick / end)', async () => {
    const db = teacher('tA');
    await assertSucceeds(updateDoc(doc(db, 'sessions/123456'), { state: 'reveal', reveal: { index: 0, correct: 1, explain: '' } }));
    await assertSucceeds(updateDoc(doc(db, 'sessions/123456'), { state: 'question', current: 1, questionStartedAt: serverTimestamp(), ['starts.1']: serverTimestamp(), reveal: null }));
    await assertSucceeds(updateDoc(doc(db, 'sessions/123456'), { locked: true, kicked: arrayUnion('s2'), playerCount: 1 }));
    await assertSucceeds(updateDoc(doc(db, 'sessions/123456'), { state: 'ended' }));
  });
  test('ATTACK: a student cannot change the session (e.g. reopen a question or unlock)', async () => {
    await assertFails(updateDoc(doc(student('s1'), 'sessions/123456'), { state: 'question', current: 1 }));
    await assertFails(updateDoc(doc(student('s1'), 'sessions/222222'), { locked: false }));
  });
  test("ATTACK: another teacher cannot change or delete someone's session", async () => {
    await assertFails(updateDoc(doc(teacher('tB'), 'sessions/123456'), { state: 'ended' }));
    await assertFails(deleteDoc(doc(teacher('tB'), 'sessions/123456')));
  });
  test('ATTACK: the owner cannot change questions, owner, expireAt or use a bad state mid-session', async () => {
    const db = teacher('tA');
    await assertFails(updateDoc(doc(db, 'sessions/123456'), { questions: [{ q: 'new', options: ['a', 'b'], time: 20 }] }));
    await assertFails(updateDoc(doc(db, 'sessions/123456'), { owner: 'tB' }));
    await assertFails(updateDoc(doc(db, 'sessions/123456'), { expireAt: Timestamp.fromMillis(Date.now() + 365 * DAY) }));
    await assertFails(updateDoc(doc(db, 'sessions/123456'), { state: 'party' }));
    await assertFails(updateDoc(doc(db, 'sessions/123456'), { current: 5 }));
  });
  test('the owner deletes a session', async () => {
    await assertSucceeds(deleteDoc(doc(teacher('tA'), 'sessions/333333')));
  });
});

/* ================================================================== private/key */
describe('answer key (private/key)', () => {
  test('ATTACK: a student cannot read the answer key', async () => {
    await assertFails(getDoc(doc(student('s1'), 'sessions/123456/private/key')));
  });
  test("ATTACK: another teacher cannot read someone's answer key", async () => {
    await assertFails(getDoc(doc(teacher('tB'), 'sessions/123456/private/key')));
  });
  test('the owner reads the answer key', async () => {
    await assertSucceeds(getDoc(doc(teacher('tA'), 'sessions/123456/private/key')));
  });
  test('ATTACK: nobody can list private docs or change the key', async () => {
    await assertFails(getDocs(collection(student('s1'), 'sessions/123456/private')));
    await assertFails(updateDoc(doc(teacher('tA'), 'sessions/123456/private/key'), { correct: [0, 0] }));
  });
  test("ATTACK: a teacher cannot add a key to another teacher's session", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), 'sessions/123456/private/key')); });
    await assertFails(setDoc(doc(teacher('tB'), 'sessions/123456/private/key'), { owner: 'tB', correct: [0, 0], explain: ['', ''], expireAt: in30d() }));
  });
  test('the owner deletes the key; others cannot', async () => {
    await assertFails(deleteDoc(doc(teacher('tB'), 'sessions/123456/private/key')));
    await assertSucceeds(deleteDoc(doc(teacher('tA'), 'sessions/123456/private/key')));
  });
});

/* ================================================================== players + names (joining) */
describe('players and nicknames', () => {
  test('a student joins with a nickname (player + names in one batch)', async () => {
    await assertSucceeds(join(student('s3'), '123456', 's3', 'Meena'));
  });
  test('ATTACK: a student cannot join as another uid (impersonation)', async () => {
    await assertFails(join(student('s3'), '123456', 's4', 'Meena'));
  });
  test('ATTACK: a nickname must be 1-20 characters, trimmed, without "/"', async () => {
    const db = student('s3');
    await assertFails(join(db, '123456', 's3', 'x'.repeat(21)));
    await assertFails(join(db, '123456', 's3', ' Meena '));
    await assertFails(setDoc(doc(db, 'sessions/123456/players/s3'), { name: 'a/b', score: 0, joinedAt: serverTimestamp(), expireAt: in30d() }));
  });
  test('ATTACK: a nickname must be reserved in names/ in the same write', async () => {
    await assertFails(setDoc(doc(student('s3'), 'sessions/123456/players/s3'), { name: 'Meena', score: 0, joinedAt: serverTimestamp(), expireAt: in30d() }));
  });
  test('ATTACK: a nickname that is taken (any case) cannot be used again', async () => {
    await assertFails(join(student('s3'), '123456', 's3', 'ASHA'));
  });
  test('ATTACK: a student cannot reserve a name that does not match their nickname', async () => {
    await assertFails(join(student('s3'), '123456', 's3', 'Meena', null, 'teacher'));
  });
  test('ATTACK: a student cannot join with a head-start score', async () => {
    await assertFails(join(student('s3'), '123456', 's3', 'Meena', { score: 100 }));
  });
  test('ATTACK: joinedAt must be the server time', async () => {
    await assertFails(join(student('s3'), '123456', 's3', 'Meena', { joinedAt: Timestamp.fromMillis(0) }));
  });
  test('ATTACK: joining a locked session is refused', async () => {
    await assertFails(join(student('s3'), '222222', 's3', 'Meena'));
  });
  test('ATTACK: joining an ended session is refused', async () => {
    await assertFails(join(student('s3'), '333333', 's3', 'Meena'));
  });
  test('ATTACK: a removed (kicked) student cannot join again', async () => {
    await assertFails(join(student('kid9'), '123456', 'kid9', 'NewName'));
  });
  test('ATTACK: joining a session that does not exist is refused', async () => {
    await assertFails(join(student('s3'), '999999', 's3', 'Meena'));
  });
  test('ATTACK: a student cannot change their own score (or anything else)', async () => {
    await assertFails(updateDoc(doc(student('s1'), 'sessions/123456/players/s1'), { score: 9999 }));
    await assertFails(updateDoc(doc(student('s1'), 'sessions/123456/players/s1'), { name: 'Teacher' }));
  });
  test("ATTACK: a student cannot change another player's score", async () => {
    await assertFails(updateDoc(doc(student('s1'), 'sessions/123456/players/s2'), { score: 0 }));
  });
  test('the session owner writes scores, points and rank', async () => {
    await assertSucceeds(updateDoc(doc(teacher('tA'), 'sessions/123456/players/s1'), { score: 950, last: 950, lastQ: 0 }));
    await assertSucceeds(updateDoc(doc(teacher('tA'), 'sessions/123456/players/s1'), { rank: 1 }));
  });
  test('ATTACK: even the owner cannot rename a player or write a negative score', async () => {
    await assertFails(updateDoc(doc(teacher('tA'), 'sessions/123456/players/s1'), { name: 'Bad' }));
    await assertFails(updateDoc(doc(teacher('tA'), 'sessions/123456/players/s1'), { score: -10 }));
  });
  test('ATTACK: another teacher cannot write scores', async () => {
    await assertFails(updateDoc(doc(teacher('tB'), 'sessions/123456/players/s1'), { score: 5 }));
  });
  test("a student reads their own player doc, not another player's", async () => {
    await assertSucceeds(getDoc(doc(student('s1'), 'sessions/123456/players/s1')));
    await assertFails(getDoc(doc(student('s1'), 'sessions/123456/players/s2')));
  });
  test('ATTACK: a student cannot list the players; the owner can', async () => {
    await assertFails(getDocs(collection(student('s1'), 'sessions/123456/players')));
    await assertSucceeds(getDocs(collection(teacher('tA'), 'sessions/123456/players')));
    await assertFails(getDocs(collection(teacher('tB'), 'sessions/123456/players')));
  });
  test('a student leaves (deletes own player + nickname); cannot delete others', async () => {
    const db = student('s1');
    const b = writeBatch(db);
    b.delete(doc(db, 'sessions/123456/players/s1'));
    b.delete(doc(db, 'sessions/123456/names/asha'));
    await assertSucceeds(b.commit());
    await assertFails(deleteDoc(doc(db, 'sessions/123456/players/s2')));
    await assertFails(deleteDoc(doc(db, 'sessions/123456/names/ravi')));
  });
  test('the owner removes a player and frees the nickname', async () => {
    const db = teacher('tA');
    const b = writeBatch(db);
    b.delete(doc(db, 'sessions/123456/players/s2'));
    b.delete(doc(db, 'sessions/123456/names/ravi'));
    b.update(doc(db, 'sessions/123456'), { kicked: arrayUnion('s2') });
    await assertSucceeds(b.commit());
  });
  test('a free nickname reads as missing; your own reservation is readable; names cannot be listed by students', async () => {
    await assertSucceeds(getDoc(doc(student('s7'), 'sessions/123456/names/meena')));       /* free: reads as missing */
    await assertSucceeds(getDoc(doc(student('s1'), 'sessions/123456/names/asha')));        /* s1's own reservation */
    await assertFails(getDocs(collection(student('s7'), 'sessions/123456/names')));
    await assertSucceeds(getDocs(collection(teacher('tA'), 'sessions/123456/names')));
  });
  test("ATTACK (fixed): reading another student's nickname reservation (and so their anonymous id) is refused", async () => {
    await assertFails(getDoc(doc(student('s7'), 'sessions/123456/names/asha')));
    await assertFails(getDoc(doc(teacher('tB'), 'sessions/123456/names/asha')));
  });
  test('ATTACK: a nickname reservation cannot be changed to another uid', async () => {
    await assertFails(updateDoc(doc(student('s3'), 'sessions/123456/names/asha'), { uid: 's3' }));
  });
});

/* ================================================================== nickname spoofing (fixed in the security review) */
describe('nickname characters and look-alike nicknames', () => {
  const ZWJ = '‍', ZWNJ = '‌', VS16 = '️';
  test('ATTACK (fixed): text-direction overrides and invisible characters are refused', async () => {
    const db = student('s3');
    for (const [name, key] of [
      ['‮ahsa', '‮ahsa'],          /* RIGHT-TO-LEFT OVERRIDE: shows as "asha" reversed tricks */
      ['Me​ena', 'me​ena'],        /* zero-width space */
      ['Meena⁠', 'meena⁠'],        /* word joiner */
      ['Meena­', 'meena­'],        /* soft hyphen */
      ['ㅤ', 'ㅤ'],                  /* Hangul filler: an "empty" nickname */
      ['Mee⁦na', 'mee⁦na'],        /* bidi isolate */
      ['Meena﻿', 'meena﻿']         /* BOM / zero-width no-break space */
    ]) await assertFails(join(db, '123456', 's3', name, null, key));
  });
  test('ATTACK (fixed): control characters, line breaks, no-break and other Unicode spaces are refused', async () => {
    const db = student('s3');
    for (const name of ['Mee\nna', 'Mee\tna', 'Mee\u0007na', 'Mee na', 'Mee na', 'Mee　na', 'Mee  na'])
      await assertFails(join(db, '123456', 's3', name, null, name.toLowerCase()));
  });
  test('ATTACK (fixed): a look-alike of a taken nickname (with an invisible joiner / variation selector) is refused', async () => {
    /* "Asha" is taken by s1; these look the same on the projector and map to the same names/ id "asha" */
    const db = student('s3');
    await assertFails(join(db, '123456', 's3', 'Asha' + ZWJ, null, 'asha'));
    await assertFails(join(db, '123456', 's3', 'As' + ZWNJ + 'ha', null, 'asha'));
    await assertFails(join(db, '123456', 's3', 'Asha' + VS16, null, 'asha'));
    /* …and reserving the look-alike under its own raw id does not work either (id must be nameKey(name)) */
    await assertFails(join(db, '123456', 's3', 'Asha' + ZWJ, null, 'asha' + ZWJ));
  });
  test('Indian-script nicknames with joiners and emoji nicknames still work (id without joiners)', async () => {
    await assertSucceeds(join(student('s3'), '123456', 's3', 'क्' + ZWJ + 'ष', null, 'क्ष'));
    await assertSucceeds(join(student('s4'), '123456', 's4', 'Riya ❤' + VS16, null, 'riya ❤'));
    await assertSucceeds(join(student('s5'), '123456', 's5', 'கவின்'));
    await assertSucceeds(join(student('s6'), '123456', 's6', 'زویا'));
  });
  test('a nickname made only of invisible joiners (empty id) is refused', async () => {
    await assertFails(join(student('s3'), '123456', 's3', ZWJ + ZWJ));          /* nameKey = '' */
    await assertFails(join(student('s3'), '123456', 's3', '.' + ZWJ));         /* nameKey = '.' (not a valid id) */
  });
});

/* ================================================================== nickname squatting (fixed) */
describe('leaving releases the nickname', () => {
  test('ATTACK (fixed): a student cannot leave but keep the nickname reserved (then rejoin as someone else)', async () => {
    await assertFails(deleteDoc(doc(student('s1'), 'sessions/123456/players/s1')));     /* names/asha would stay */
  });
  test('ATTACK (fixed): a student cannot drop the reservation but stay a player (a second "Asha" could join)', async () => {
    await assertFails(deleteDoc(doc(student('s1'), 'sessions/123456/names/asha')));
  });
  test('a nickname left behind without a player (e.g. after being removed) can be deleted by its holder', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), 'sessions/123456/players/s1')); });
    await assertSucceeds(deleteDoc(doc(student('s1'), 'sessions/123456/names/asha')));
  });
  test('a player whose reservation is already gone can leave', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), 'sessions/123456/names/asha')); });
    await assertSucceeds(deleteDoc(doc(student('s1'), 'sessions/123456/players/s1')));
  });
});

/* ================================================================== who can read a session after it ends (fixed) */
describe('session visibility (code guessing)', () => {
  test('ATTACK (fixed): an ended session cannot be read by someone who just knows or guesses the code', async () => {
    await assertFails(getDoc(doc(student('s9'), 'sessions/333333')));
    await assertFails(getDoc(doc(teacher('tB'), 'sessions/333333')));
  });
  test('an ended session stays readable for its owner and its own players (final screen, "Remove me")', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sessions/333333/players/s1'), { name: 'Asha', score: 900, joinedAt: Timestamp.now(), expireAt: in30d(), rank: 1 });
    });
    await assertSucceeds(getDoc(doc(teacher('tA'), 'sessions/333333')));
    await assertSucceeds(getDoc(doc(student('s1'), 'sessions/333333')));
  });
  test('ATTACK (fixed): a forgotten session (not ended, older than 1 day) cannot be read or joined by strangers', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sessions/777777'), sessionDoc('tA', { createdAt: Timestamp.fromMillis(Date.now() - 2 * DAY) }));
    });
    await assertFails(getDoc(doc(student('s9'), 'sessions/777777')));
    await assertFails(join(student('s9'), '777777', 's9', 'Meena'));
    await assertSucceeds(getDoc(doc(teacher('tA'), 'sessions/777777')));
  });
  test('a missing code reads as missing (the app says "no quiz with this code")', async () => {
    await assertSucceeds(getDoc(doc(student('s9'), 'sessions/999999')));
  });
  test('a removed (kicked) student loses access once the session has ended', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await updateDoc(doc(ctx.firestore(), 'sessions/123456'), { state: 'ended' }); });
    await assertFails(getDoc(doc(student('kid9'), 'sessions/123456')));
    await assertSucceeds(getDoc(doc(student('s2'), 'sessions/123456')));
  });
});

/* ================================================================== answers */
describe('answers', () => {
  test('a player answers the current question once', async () => {
    await assertSucceeds(answer(student('s1'), '123456', 's1', 0, 1));
  });
  test('ATTACK: answering the same question twice is refused', async () => {
    const db = student('s1');
    await assertSucceeds(answer(db, '123456', 's1', 0, 1));
    await assertFails(answer(db, '123456', 's1', 0, 3));
  });
  test('ATTACK: answering a question that is not the current one is refused', async () => {
    await assertFails(answer(student('s1'), '123456', 's1', 1, 0));
  });
  test('ATTACK: answering while the answer is being shown (reveal) is refused', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await updateDoc(doc(ctx.firestore(), 'sessions/123456'), { state: 'reveal' }); });
    await assertFails(answer(student('s1'), '123456', 's1', 0, 1));
  });
  test('ATTACK: answering in an ended session is refused', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await updateDoc(doc(ctx.firestore(), 'sessions/123456'), { state: 'ended' }); });
    await assertFails(answer(student('s1'), '123456', 's1', 0, 1));
  });
  test('ATTACK: a choice that is not one of the options is refused', async () => {
    await assertFails(answer(student('s1'), '123456', 's1', 0, 4));
    await assertFails(answer(student('s1'), '123456', 's1', 0, -1));
  });
  test('ATTACK: a student who has not joined (or was removed) cannot answer', async () => {
    await assertFails(answer(student('s8'), '123456', 's8', 0, 1));
    await assertFails(answer(student('kid9'), '123456', 'kid9', 0, 1));
  });
  test('ATTACK: a student cannot answer for another player', async () => {
    /* s2 has not answered q0 here, so these fail because of the uid checks, not because the doc exists */
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), 'sessions/123456/answers/s2_0')); });
    await assertFails(answer(student('s1'), '123456', 's2', 0, 1));                 /* uid field + id of s2 */
    await assertFails(answer(student('s1'), '123456', 's1', 0, 1, null, 's2_0'));   /* own uid, s2's id */
  });
  test('ATTACK: the answer time must be the server time (no faked fast answers)', async () => {
    await assertFails(answer(student('s1'), '123456', 's1', 0, 1, { at: Timestamp.fromMillis(Date.now() - 60000) }));
  });
  test('ATTACK: extra fields in an answer are refused', async () => {
    await assertFails(answer(student('s1'), '123456', 's1', 0, 1, { correct: true }));
  });
  test("a student reads their own answers, never another student's", async () => {
    await assertSucceeds(getDoc(doc(student('s2'), 'sessions/123456/answers/s2_0')));
    await assertSucceeds(getDoc(doc(student('s1'), 'sessions/123456/answers/s1_0')));    /* not there yet: reads as missing */
    await assertFails(getDoc(doc(student('s1'), 'sessions/123456/answers/s2_0')));
  });
  test('a student lists only their own answers (where uid == me)', async () => {
    await assertSucceeds(getDocs(query(collection(student('s1'), 'sessions/123456/answers'), where('uid', '==', 's1'))));
    await assertFails(getDocs(collection(student('s1'), 'sessions/123456/answers')));
    await assertFails(getDocs(query(collection(student('s1'), 'sessions/123456/answers'), where('uid', '==', 's2'))));
  });
  test("the owner reads all answers; another teacher cannot", async () => {
    await assertSucceeds(getDocs(collection(teacher('tA'), 'sessions/123456/answers')));
    await assertFails(getDocs(collection(teacher('tB'), 'sessions/123456/answers')));
  });
  test('ATTACK: a student cannot change or delete an answer during the quiz; the owner can delete', async () => {
    await assertFails(updateDoc(doc(student('s2'), 'sessions/123456/answers/s2_0'), { choice: 1 }));
    await assertFails(deleteDoc(doc(student('s2'), 'sessions/123456/answers/s2_0')));
    await assertSucceeds(deleteDoc(doc(teacher('tA'), 'sessions/123456/answers/s2_0')));
  });
  test('"Remove me": after the end a student deletes their own answers, never another student\'s', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'sessions/123456/answers/s1_0'), { uid: 's1', i: 0, choice: 1, at: Timestamp.now(), expireAt: in30d() });
      await updateDoc(doc(db, 'sessions/123456'), { state: 'ended' });
    });
    await assertFails(deleteDoc(doc(student('s1'), 'sessions/123456/answers/s2_0')));
    await assertSucceeds(deleteDoc(doc(student('s1'), 'sessions/123456/answers/s1_0')));
  });
  test('"Remove me" also works when the teacher already deleted the session', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), 'sessions/123456')); });
    await assertSucceeds(deleteDoc(doc(student('s2'), 'sessions/123456/answers/s2_0')));
  });
});

/* ================================================================== everything else */
describe('everything else is denied', () => {
  test('ATTACK: unknown collections cannot be read or written', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'analytics/x'), { a: 1 }));
    await assertFails(getDoc(doc(teacher('tA'), 'users/tA')));
    await assertFails(setDoc(doc(student('s1'), 'sessions/123456/chat/m1'), { text: 'hi' }));
  });
});

/* ================================================================== interest/{uid}: the "Stay updated" list
   What cloud.js does: a NEW anonymous account per sign-up, then ONE setDoc on interest/{that uid}. The rules allow
   create only, once per account; nobody (not even the person who signed up) can read, list, change or delete it. */
describe('interest (updates list)', () => {
  const FIELDS = ['name', 'email', 'role', 'org', 'place', 'prefLang', 'topics', 'consent', 'lang', 'page', 'createdAt', 'uid'];
  const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
  const rec = (uid, over) => Object.assign({
    name: 'Asha Verma', email: 'asha@example.com', role: 'teacher', org: 'DPS Bhopal', place: 'Bhopal',
    prefLang: 'hi', topics: ['apps', 'videos'], consent: true, lang: 'hi', page: 'schools', createdAt: serverTimestamp(), uid
  }, over || {});
  /* uid signs up at interest/{uid} (as an anonymous user unless db is given) */
  const add = (uid, over, db) => setDoc(doc(db || student(uid), 'interest/' + uid), rec(uid, over));
  /* v0 signed up earlier */
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'interest/v0'), rec('v0', { createdAt: Timestamp.now() }));
    });
  });

  test('valid: an anonymous visitor signs up at interest/{own uid}', async () => {
    await assertSucceeds(add('v1'));
    let stored = null;
    await env.withSecurityRulesDisabled(async (ctx) => { stored = (await getDoc(doc(ctx.firestore(), 'interest/v1'))).data(); });
    assert.deepStrictEqual(Object.keys(stored).sort(), FIELDS.slice().sort());
    assert.strictEqual(stored.uid, 'v1');
  });
  test('valid: empty optional fields, every role / page / language / topic set from the fixed lists', async () => {
    await assertSucceeds(add('v1', { name: '', org: '', place: '', topics: ['training'], page: 'business', role: 'org' }));
    let n = 0;
    for (const role of ['teacher', 'principal', 'student', 'parent', 'org', 'other']) await assertSucceeds(add('r' + n++, { role }));
    for (const page of ['home', 'schools', 'business', 'other']) await assertSucceeds(add('r' + n++, { page }));
    for (const l of LANGS) await assertSucceeds(add('r' + n++, { lang: l, prefLang: l }));
    for (const topics of [['apps'], ['videos'], ['training'], ['videos', 'apps'], ['apps', 'videos', 'training']]) await assertSucceeds(add('r' + n++, { topics }));
  });
  test('valid: Indian-language text and email addresses, and the exact length limits', async () => {
    await assertSucceeds(add('v1', { name: 'आशा वर्मा', org: 'केन्द्रीय विद्यालय', place: 'भोपाल', email: 'राम@उदाहरण.भारत' }));
    await assertSucceeds(add('v2', { name: 'n'.repeat(60), org: 'o'.repeat(80), place: 'p'.repeat(60) }));
    await assertSucceeds(add('v3', { email: 'a'.repeat(242) + '@example.com' }));     /* 254 characters */
    await assertSucceeds(add('v4', { email: 'a.b+tag@sub.example.co.in' }));
  });
  test('valid: a teacher signed in with Google may sign up too (own uid)', async () => {
    await assertSucceeds(add('tA', { role: 'teacher' }, teacher('tA')));
  });
  test('ATTACK: signed-out visitors cannot sign up', async () => {
    await assertFails(setDoc(doc(nobody(), 'interest/x'), rec('x')));
    await assertFails(setDoc(doc(collection(nobody(), 'interest')), rec('x')));
  });
  test('consent: missing, false or not exactly true is refused', async () => {
    const r = rec('v1'); delete r.consent;
    await assertFails(setDoc(doc(student('v1'), 'interest/v1'), r));
    for (const consent of [false, 'true', 'yes', 1, null]) await assertFails(add('v1', { consent }));
  });
  test('email: must look like an email, lower case, without spaces, 6–254 characters', async () => {
    for (const email of ['', 'asha', 'asha@x', 'asha@example', '@example.com', 'asha@.com', 'a@@b.com', 'a b@example.com',
      'Asha@Example.com', ' asha@example.com', 'asha@example.com ', 'a@b.c', 'ab@c.d', 'asha@example.c',
      'a'.repeat(243) + '@example.com', 123, null, ['asha@example.com']]) {
      await assertFails(add('v1', { email }));
    }
  });
  test('ATTACK: extra fields are refused', async () => {
    for (const extra of [{ phone: '9999999999' }, { demo: true }, { admin: true }, { notes: '' }]) await assertFails(add('v1', extra));
  });
  test('every field is required: leaving out any one is refused', async () => {
    for (const k of FIELDS) {
      const r = rec('v1'); delete r[k];
      await assertFails(setDoc(doc(student('v1'), 'interest/v1'), r));
    }
  });
  test('too long: name over 60, organisation over 80, place over 60 characters', async () => {
    await assertFails(add('v1', { name: 'n'.repeat(61) }));
    await assertFails(add('v1', { org: 'o'.repeat(81) }));
    await assertFails(add('v1', { place: 'p'.repeat(61) }));
    await assertFails(add('v1', { name: 'आ'.repeat(61) }));
  });
  test('ATTACK: control characters and line breaks in any text are refused', async () => {
    await assertFails(add('v1', { name: 'line\nbreak' }));
    await assertFails(add('v1', { org: 'tab\there' }));
    await assertFails(add('v1', { place: 'nul\u0000' }));
    await assertFails(add('v1', { name: 'bell\u0007' }));
    await assertFails(add('v1', { email: 'as\u0001ha@example.com' }));
  });
  test('wrong types are refused', async () => {
    for (const over of [{ name: 5 }, { org: null }, { place: ['Bhopal'] }, { role: 1 }, { page: 0 }, { lang: ['hi'] },
      { prefLang: null }, { topics: 'apps' }, { topics: { 0: 'apps' } }, { createdAt: 'now' }, { uid: 1 }]) {
      await assertFails(add('v1', over));
    }
  });
  test('role, page and languages must come from the fixed lists', async () => {
    for (const over of [{ role: 'admin' }, { role: 'Teacher' }, { page: 'evil' }, { page: 'x'.repeat(61) }, { prefLang: 'fr' },
      { prefLang: 'HI' }, { lang: 'xx' }, { lang: '' }]) {
      await assertFails(add('v1', over));
    }
  });
  test('topics: 1 to 3 different topics from the list', async () => {
    for (const topics of [[], ['spam'], ['apps', 'spam'], ['apps', 'apps'], ['apps', 'videos', 'training', 'apps'], [1]]) {
      await assertFails(add('v1', { topics }));
    }
  });
  test('ATTACK: the uid inside the record must be your own', async () => {
    await assertFails(add('v1', { uid: 'v2' }));
    await assertFails(add('v1', { uid: '' }));
  });
  test('ATTACK: the document id must be your own uid (no random ids, no signing up someone else)', async () => {
    await assertFails(setDoc(doc(collection(student('v1'), 'interest')), rec('v1')));
    await assertFails(setDoc(doc(student('v1'), 'interest/v2'), rec('v1')));
    await assertFails(setDoc(doc(student('v1'), 'interest/v2'), rec('v2')));
    await assertFails(setDoc(doc(teacher('tA'), 'interest/v9'), rec('tA')));
  });
  test('ATTACK: createdAt must be the server time', async () => {
    await assertFails(add('v1', { createdAt: Timestamp.fromMillis(Date.now() - DAY) }));
    await assertFails(add('v1', { createdAt: Timestamp.fromMillis(Date.now() + DAY) }));
    await assertFails(add('v1', { createdAt: Date.now() }));
  });
  test('ATTACK: one sign-up per account: a second write, a merge or a batch of several is refused', async () => {
    await assertSucceeds(add('v1'));
    await assertFails(add('v1', { email: 'second@example.com' }));
    await assertFails(setDoc(doc(student('v1'), 'interest/v1'), { topics: ['apps'] }, { merge: true }));
    await assertFails(add('v0', { email: 'takeover@example.com' }));
    const db = student('v2'), b = writeBatch(db);
    b.set(doc(db, 'interest/v2'), rec('v2'));
    b.set(doc(db, 'interest/v2b'), rec('v2'));
    await assertFails(b.commit());
  });
  test('ATTACK: nobody can read a sign-up, not even their own, and a missing id reads as refused too', async () => {
    await assertFails(getDoc(doc(student('v0'), 'interest/v0')));
    await assertFails(getDoc(doc(student('v1'), 'interest/v0')));
    await assertFails(getDoc(doc(teacher('tA'), 'interest/v0')));
    await assertFails(getDoc(doc(nobody(), 'interest/v0')));
    await assertFails(getDoc(doc(student('v9'), 'interest/v9')));
  });
  test('ATTACK: nobody can list or search the list (no email harvesting)', async () => {
    await assertFails(getDocs(collection(student('v1'), 'interest')));
    await assertFails(getDocs(query(collection(student('v0'), 'interest'), where('uid', '==', 'v0'))));
    await assertFails(getDocs(query(collection(teacher('tA'), 'interest'), where('email', '==', 'asha@example.com'))));
    await assertFails(getDocs(collection(nobody(), 'interest')));
  });
  test('ATTACK: nobody can change a sign-up', async () => {
    await assertFails(updateDoc(doc(student('v0'), 'interest/v0'), { topics: ['apps'] }));
    await assertFails(updateDoc(doc(student('v0'), 'interest/v0'), { consent: false }));
    await assertFails(setDoc(doc(student('v0'), 'interest/v0'), rec('v0')));
    await assertFails(updateDoc(doc(teacher('tA'), 'interest/v0'), { email: 'x@example.com' }));
  });
  test('ATTACK: nobody can delete a sign-up', async () => {
    await assertFails(deleteDoc(doc(student('v0'), 'interest/v0')));
    await assertFails(deleteDoc(doc(teacher('tA'), 'interest/v0')));
    await assertFails(deleteDoc(doc(nobody(), 'interest/v0')));
    await assertFails(deleteDoc(doc(student('v9'), 'interest/v9')));
  });
});

/* ================================================================== stats/signups: the public sign-up counter
   What cloud.js does: ONE batch per sign-up = create interest/{my new uid} + set stats/signups {count: increment(1)}
   (merge, so the very first sign-up creates the counter with 1). Rules: +1 only together with a NEW sign-up of the
   writer's own account; anyone may read the number; nothing else. */
describe('stats/signups (public sign-up counter)', () => {
  const rec = (uid, over) => Object.assign({
    name: '', email: uid.toLowerCase() + '@example.com', role: 'teacher', org: '', place: '',
    prefLang: 'hi', topics: ['apps'], consent: true, lang: 'hi', page: 'home', createdAt: serverTimestamp(), uid
  }, over || {});
  const COUNTER = 'stats/signups';
  /* the batch cloud.js sends: the sign-up + the counter change (default: increment(1), merged).
     counter null = no counter write; opts: db, path, merge:false, noInterest, rec (overrides for the sign-up) */
  function signup(uid, counter, opts) {
    opts = opts || {};
    const db = opts.db || student(uid), b = writeBatch(db);
    if (!opts.noInterest) b.set(doc(db, 'interest/' + uid), rec(uid, opts.rec));
    if (counter !== null) {
      const data = counter === undefined ? { count: increment(1) } : counter;
      if (opts.merge === false) b.set(doc(db, opts.path || COUNTER), data);
      else b.set(doc(db, opts.path || COUNTER), data, { merge: true });
    }
    return b.commit();
  }
  const seedCount = (n, extra) => env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), COUNTER), Object.assign({ count: n }, extra || {}));
  });
  const stored = async () => {
    let v = null;
    await env.withSecurityRulesDisabled(async (ctx) => { const s = await getDoc(doc(ctx.firestore(), COUNTER)); v = s.exists() ? s.data() : null; });
    return v;
  };
  /* v0 signed up earlier (before the counter existed) */
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'interest/v0'), rec('v0', { createdAt: Timestamp.now() }));
    });
  });

  test('valid: the first sign-up creates the counter with 1 (increment on a missing document)', async () => {
    await assertSucceeds(signup('v1'));
    assert.deepStrictEqual(await stored(), { count: 1 });
  });
  test('valid: every new sign-up adds exactly 1 (increment(1), or the next number written out)', async () => {
    await seedCount(41);
    await assertSucceeds(signup('v1'));
    assert.deepStrictEqual(await stored(), { count: 42 });
    await assertSucceeds(signup('v2', { count: 43 }));
    await assertSucceeds(signup('v3', { count: 44 }, { merge: false }));
    await assertSucceeds(signup('tA', undefined, { db: teacher('tA') }));      /* a Google teacher signing up for themselves */
    assert.deepStrictEqual(await stored(), { count: 45 });
  });
  test('valid: anyone may read the number, even signed out; a missing counter reads as "not there yet"', async () => {
    const none = await assertSucceeds(getDoc(doc(nobody(), COUNTER)));
    assert.strictEqual(none.exists(), false);
    await seedCount(7);
    for (const db of [nobody(), student('v1'), student('v0'), teacher('tB')]) {
      const s = await assertSucceeds(getDoc(doc(db, COUNTER)));
      assert.strictEqual(s.data().count, 7);
    }
  });
  test('valid: a sign-up without the +1 (an old cached page) is still accepted; the counter only lags', async () => {
    await seedCount(5);
    await assertSucceeds(signup('v1', null));
    assert.deepStrictEqual(await stored(), { count: 5 });
  });
  test('ATTACK: no +1 without a sign-up (counter alone, signed in or signed out)', async () => {
    await assertFails(setDoc(doc(student('v1'), COUNTER), { count: increment(1) }, { merge: true }));
    await assertFails(setDoc(doc(student('v1'), COUNTER), { count: 1 }));
    await assertFails(setDoc(doc(nobody(), COUNTER), { count: 1 }));
    await seedCount(10);
    await assertFails(updateDoc(doc(student('v1'), COUNTER), { count: increment(1) }));
    await assertFails(updateDoc(doc(student('v1'), COUNTER), { count: 11 }));
    await assertFails(updateDoc(doc(teacher('tA'), COUNTER), { count: 11 }));
    await assertFails(updateDoc(doc(nobody(), COUNTER), { count: 11 }));
    assert.deepStrictEqual(await stored(), { count: 10 });
  });
  test('ATTACK: no jumps: +2, +10, a big number, or a new counter that does not start at 1', async () => {
    await assertFails(signup('v1', { count: increment(2) }));
    await assertFails(signup('v1', { count: 5 }));
    await assertFails(signup('v1', { count: 0 }));
    await seedCount(10);
    for (const counter of [{ count: increment(2) }, { count: increment(10) }, { count: 12 }, { count: 1000000 }, { count: increment(1.5) }]) {
      await assertFails(signup('v1', counter));
    }
    assert.deepStrictEqual(await stored(), { count: 10 });
  });
  test('ATTACK: the counter never goes down, stays put or resets', async () => {
    await seedCount(10);
    for (const counter of [{ count: increment(-1) }, { count: 9 }, { count: 0 }, { count: 10 }, { count: increment(0) }, { count: 1 }]) {
      await assertFails(signup('v1', counter));
    }
    assert.deepStrictEqual(await stored(), { count: 10 });
  });
  test('ATTACK: one +1 per account: a second sign-up, or a later +1 by an account that already signed up, is refused', async () => {
    await seedCount(10);
    await assertSucceeds(signup('v1'));
    await assertFails(signup('v1'));                                            /* the same account again */
    await assertFails(signup('v1', undefined, { noInterest: true }));           /* +1 alone, sign-up already there */
    await assertFails(signup('v0', undefined, { noInterest: true }));           /* signed up earlier without the counter */
    await assertFails(signup('v0', undefined, { rec: { email: 'again@example.com' } }));
    assert.deepStrictEqual(await stored(), { count: 11 });
  });
  test("ATTACK: a +1 counts only for the writer's OWN new sign-up (not someone else's, not a refused one)", async () => {
    await seedCount(10);
    const db = student('v2'), b = writeBatch(db);
    b.set(doc(db, 'interest/v3'), rec('v3'));                                   /* someone else's id: refused anyway */
    b.set(doc(db, COUNTER), { count: increment(1) }, { merge: true });
    await assertFails(b.commit());
    await assertFails(signup('v1', undefined, { rec: { consent: false } }));    /* an invalid sign-up takes the +1 down with it */
    await assertFails(signup('v1', undefined, { rec: { email: 'NOT-AN-EMAIL' } }));
    assert.deepStrictEqual(await stored(), { count: 10 });
  });
  test('ATTACK: only {count}: extra fields, other documents in stats/ and wrong types are refused', async () => {
    await assertFails(signup('v1', { count: 1, admin: true }));
    await seedCount(10);
    await assertFails(signup('v1', { count: increment(1), note: 'hi' }));
    await assertFails(signup('v1', { count: '11' }, { merge: false }));
    await assertFails(signup('v1', { count: 11, total: 99 }, { merge: false }));
    await assertFails(signup('v1', { count: increment(1) }, { path: 'stats/other' }));
    await assertFails(signup('v1', { count: 1 }, { path: 'stats/likes' }   /* stats/visits is the public visitor counter (own tests below) */));
    assert.deepStrictEqual(await stored(), { count: 10 });
  });
  test('ATTACK: nobody can delete the counter, list stats/ or read other stats documents', async () => {
    await seedCount(10);
    await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'stats/secret'), { x: 1 }); });
    for (const db of [nobody(), student('v1'), teacher('tA')]) {
      await assertFails(deleteDoc(doc(db, COUNTER)));
      await assertFails(getDocs(collection(db, 'stats')));
      await assertFails(getDoc(doc(db, 'stats/secret')));
    }
    assert.deepStrictEqual(await stored(), { count: 10 });
  });
  test('ATTACK: two +1 writes to the counter in the SAME batch as one sign-up are refused (no +2 per account)', async () => {
    await seedCount(10);
    const db = student('v1'), b = writeBatch(db);
    b.set(doc(db, 'interest/v1'), rec('v1'));
    b.set(doc(db, COUNTER), { count: increment(1) }, { merge: true });
    b.set(doc(db, COUNTER), { count: increment(1) }, { merge: true });
    await assertFails(b.commit());
    const db2 = student('v2'), b2 = writeBatch(db2);
    b2.set(doc(db2, 'interest/v2'), rec('v2'));
    b2.set(doc(db2, COUNTER), { count: 11 });
    b2.update(doc(db2, COUNTER), { count: increment(1) });
    await assertFails(b2.commit());
    assert.deepStrictEqual(await stored(), { count: 10 });
    const db3 = student('v3'), b3 = writeBatch(db3);                      /* first sign-up: create twice in one batch */
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), COUNTER)); });
    b3.set(doc(db3, 'interest/v3'), rec('v3'));
    b3.set(doc(db3, COUNTER), { count: increment(1) }, { merge: true });
    b3.set(doc(db3, COUNTER), { count: increment(1) }, { merge: true });
    await assertFails(b3.commit());
    assert.strictEqual(await stored(), null);
  });
  test('a run of sign-ups from new accounts counts each one exactly once', async () => {
    for (let i = 1; i <= 6; i++) await assertSucceeds(signup('n' + i));
    await assertFails(signup('n3'));
    assert.deepStrictEqual(await stored(), { count: 6 });
  });
});

/* ================================================================== stats/visits: the public visitor counter
   What shared/visits.js does: ONE REST commit with a field transform count += 1, no sign-in. */
describe('stats/visits (public visitor counter)', () => {
  const V = 'stats/visits';
  const stored = async () => {
    let d = null;
    await env.withSecurityRulesDisabled(async (ctx) => { const s = await getDoc(doc(ctx.firestore(), V)); d = s.exists() ? s.data() : null; });
    return d;
  };
  test('anyone (no sign-in) can read it and add exactly 1, first visit creates it at 1', async () => {
    const db = nobody();
    await assertSucceeds(setDoc(doc(db, V), { count: increment(1) }, { merge: true }));
    assert.deepStrictEqual(await stored(), { count: 1 });
    await assertSucceeds(setDoc(doc(db, V), { count: increment(1) }, { merge: true }));
    await assertSucceeds(updateDoc(doc(student('s9'), V), { count: increment(1) }));
    assert.deepStrictEqual(await stored(), { count: 3 });
    await assertSucceeds(getDoc(doc(db, V)));
  });
  test('ATTACK: no jumps, no going down, no extra fields, no delete, no list', async () => {
    const db = nobody();
    await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), V), { count: 50 }); });
    await assertFails(setDoc(doc(db, V), { count: 1000 }));
    await assertFails(updateDoc(doc(db, V), { count: increment(2) }));
    await assertFails(updateDoc(doc(db, V), { count: 49 }));
    await assertFails(updateDoc(doc(db, V), { count: increment(1), x: 1 }));
    await assertFails(updateDoc(doc(db, V), { count: 50.5 }));
    await assertFails(deleteDoc(doc(db, V)));
    await assertFails(getDocs(collection(db, 'stats')));
    const b = writeBatch(db);                                              /* two +1 in one batch = +2 */
    b.update(doc(db, V), { count: increment(1) }); b.update(doc(db, V), { count: increment(1) });
    await assertFails(b.commit());
    assert.deepStrictEqual(await stored(), { count: 50 });
  });
  test('ATTACK: a first write that is not 1 is refused, and other stats documents stay closed', async () => {
    const db = nobody();
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), V)); });
    await assertFails(setDoc(doc(db, V), { count: 500 }));
    await assertFails(setDoc(doc(db, 'stats/other'), { count: 1 }));
    await assertFails(setDoc(doc(db, 'stats/signups'), { count: 1 }));
    assert.strictEqual(await stored(), null);
  });
});
