// ======================================
// Voting System - Main Logic (Employee Side)
// ======================================

let currentPollId = null;
let hasVoted = false;
// เพิ่มบรรทัดนี้เพื่อให้ voting.js รู้จักตัวแปร db
const db = window.db;
// ======================================
// Initialization
// ======================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Thai Summit Voting system...');
    initializePage();
    // เรายังคงใช้ signInAnonymously เพื่อเชื่อมต่อ Firebase เบื้องต้น
    authenticateUser(); 
});

function initializePage() {
    // แสดงวันที่ปัจจุบัน
    const today = new Date();
    const dateStr = today.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    document.getElementById('currentDate').textContent = dateStr;
}

// ======================================
// Authentication (Firebase Connection)
// ======================================
function authenticateUser() {
    auth.signInAnonymously()
        .then(() => {
            console.log('✅ Connected to Firebase');
            loadActivePoll(); // โหลดหัวข้อที่ Admin เปิดอยู่
        })
        .catch((error) => {
            console.error('❌ Connection failed:', error);
            showMessage('❌ ไม่สามารถเชื่อมต่อระบบได้: ' + error.message, 'error');
        });
}

// ======================================
// Load Active Poll
// ======================================
function loadActivePoll() {
    // คอยฟังว่า Admin เปิดหัวข้อไหน (status: active)
    db.ref('polls')
        .orderByChild('status')
        .equalTo('active')
        .on('value', (snapshot) => {
            const polls = snapshot.val();
            if (polls) {
                const pollId = Object.keys(polls)[0];
                const poll = polls[pollId];
                currentPollId = pollId;
                displayPoll(poll);
                // เมื่อหัวข้อเปลี่ยน ให้เช็คสถานะการโหวตใหม่
                resetVoteStatus();
            } else {
                displayNoPoll();
            }
        });
}

function displayPoll(poll) {
    document.getElementById('pollTitle').textContent = poll.question;
    document.getElementById('pollDescription').textContent = poll.description;
    document.getElementById('pollStatus').textContent = 'เปิดรับโหวต';
    document.getElementById('pollStatus').className = 'status-badge status-active';
    enableVoteButtons();
}

function displayNoPoll() {
    document.getElementById('pollTitle').textContent = 'ยังไม่มีหัวข้อโหวตที่เปิดอยู่';
    document.getElementById('pollDescription').textContent = 'กรุณารอประธานเปิดหัวข้อโหวต';
   document.getElementById('pollStatus').textContent = 'ไม่มีการโหวต';
   document.getElementById('pollStatus').className = 'status-badge status-closed';
    disableVoteButtons();
}

// ======================================
// Cast Vote (แก้จุดนี้เพื่อใช้รหัสพนักงาน)
// ======================================
function castVote(option) {
    const empInput = document.getElementById('empId');
    const empId = empInput.value.trim();

    // 1. ตรวจสอบว่ากรอกรหัสพนักงานหรือยัง
    if (!empId) {
        alert("⚠️ กรุณากรอกรหัสพนักงานก่อนลงคะแนน");
        empInput.focus();
        return;
    }

    if (!currentPollId) return;

    // 2. ตรวจสอบการโหวตซ้ำในฐานข้อมูลโดยใช้รหัสพนักงาน
    db.ref(`votes/${currentPollId}/${empId}`).once('value', (snapshot) => {
        if (snapshot.exists()) {
            alert("⚠️ รหัสพนักงานนี้ได้ลงคะแนนไปแล้ว");
            hasVoted = true;
            disableVoteButtons();
            return;
        }

        // 3. บันทึกคะแนนลง Firebase
        db.ref(`votes/${currentPollId}/${empId}`).set({
            employeeId: empId,
            option: option,
            timestamp: Date.now()
        })
        .then(() => {
            hasVoted = true;
            document.getElementById('displayEmpId').textContent = empId; // แสดงรหัสที่ใช้โหวต
            empInput.disabled = true; // ล็อคช่องกรอกรหัส
            showMessage(`✅ บันทึกคะแนน "${getVoteText(option)}" เรียบร้อยแล้ว`, 'success');
            disableVoteButtons();
        })
        .catch((error) => {
            alert("❌ เกิดข้อผิดพลาด: " + error.message);
        });
    });
}

// ======================================
// Helper Functions
// ======================================

function resetVoteStatus() {
    hasVoted = false;
    const empInput = document.getElementById('empId');
    empInput.disabled = false;
    document.getElementById('displayEmpId').textContent = "กำลังรอลงคะแนน...";
}

function getVoteText(option) {
    const texts = { 'approve': 'เห็นชอบ', 'disapprove': 'ไม่เห็นชอบ', 'abstain': 'งดออกเสียง' };
    return texts[option] || option;
}

function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = 'message message-' + type;
    msgDiv.style.display = 'block';
    setTimeout(() => { msgDiv.style.display = 'none'; }, 5000);
}

function disableVoteButtons() {
    ['btnApprove', 'btnDisapprove', 'btnAbstain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });
}

function enableVoteButtons() {
    if (hasVoted) return;
    ['btnApprove', 'btnDisapprove', 'btnAbstain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
}