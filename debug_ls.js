console.log('--- GLOBAL LOCALSTORAGE DEBUG ---');
console.log('typeof localStorage:', typeof localStorage);
if (typeof localStorage !== 'undefined') {
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('localStorage.getItem type:', typeof localStorage.getItem);
  try {
    console.log('localStorage.getItem("test"):', localStorage.getItem('test'));
  } catch (e) {
    console.error('Error calling getItem:', e.message);
  }
} else {
  console.log('localStorage is undefined');
}
console.log('---------------------------------');
