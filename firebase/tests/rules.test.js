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
 * reservations, and reading ended or forgotten sessions by guessing codes. */
'use strict';
const { describe, test, before, after, beforeEach } = require('node:test');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, writeBatch,
  serverTimestamp, Timestamp, arrayUnion, runTransaction
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
