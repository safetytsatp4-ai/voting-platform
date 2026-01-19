// ======================================
// Admin System - Logic (Thai Summit Automotive)
// ======================================

// ปรับส่วนหัวของ admin.js เพื่อป้องกัน db ว่างเปล่า
const db = window.db || (typeof firebase !== 'undefined' ? firebase.database() : null);

if (!db) {
    console.error("❌ ไม่สามารถเชื่อมต่อ Firebase ได้! กรุณาตรวจสอบไฟล์ firebase-config.js");
}
const ADMIN_PASSWORD = "123456789";

// 1. ฟังก์ชันเข้าสู่ระบบ
function checkAdminPass() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        listenToResults(); 
        loadPollHistory(); // ดึงประวัติมาโชว์
        console.log("🔓 Admin logged in & Listening to votes...");
    } else {
        alert("รหัสผ่านไม่ถูกต้อง!");
    }
}

// 2. ฟังก์ชันอัปเดตหัวข้อโหวต (แก้ไขให้บันทึกประวัติด้วย)
function updatePoll() {
    const question = document.getElementById('newQuestion').value;
    const desc = document.getElementById('newDesc').value;

    if (!question) {
        alert("กรุณาระบุหัวข้อโหวตก่อนครับ");
        return;
    }

    const pollData = {
        question: question,
        description: desc,
        status: 'active',
        timestamp: Date.now()
    };

    // อัปเดตหัวข้อปัจจุบันที่ poll001
    db.ref('polls/poll001').set(pollData)
    .then(() => {
        // ✅ บันทึกลง pollHistory เพื่อเก็บเป็นประวัติย้อนหลัง
        db.ref('pollHistory').push(pollData); 
        
        alert("📢 อัปเดตหัวข้อและเปิดโหวตเรียบร้อยแล้ว!");
        document.getElementById('newQuestion').value = "";
        document.getElementById('newDesc').value = "";
    })
    .catch((error) => alert("เกิดข้อผิดพลาด: " + error.message));
}

// 3. ฟังก์ชันดึงประวัติมาแสดง (แก้ไขให้ดึงจาก pollHistory)
function loadPollHistory() {
    // ใช้ id ให้ตรงกับใน html (historyTableBody หรือ pollHistory)
    const historyTableBody = document.getElementById('historyTableBody');
    
    db.ref('pollHistory').on('value', (snapshot) => {
        const historyData = snapshot.val() || {};
        const polls = Object.values(historyData).reverse(); // ใหม่ไปเก่า
        
        if (polls.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">ไม่มีประวัติการโหวต</td></tr>';
            return;
        }

        let html = '';
        polls.forEach(poll => {
            const date = new Date(poll.timestamp).toLocaleString('th-TH');
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${poll.question}</td>
                </tr>
            `;
        });
        historyTableBody.innerHTML = html;
    });
}

// 4. ฟังก์ชันติดตามผลโหวต Real-time
function listenToResults() {
    db.ref('votes/poll001').on('value', (snapshot) => {
        const votes = snapshot.val() || {};
        const voteEntries = Object.values(votes);
        
        const counts = { approve: 0, disapprove: 0, abstain: 0 };
        voteEntries.forEach(vote => {
            if (counts.hasOwnProperty(vote.option)) counts[vote.option]++;
        });

        const total = voteEntries.length;
        updateAdminUI(counts, total);
    });
}

// 5. อัปเดตหน้าจอ
function updateAdminUI(counts, total) {
    document.getElementById('approveCount').textContent = counts.approve;
    document.getElementById('disapproveCount').textContent = counts.disapprove;
    document.getElementById('abstainCount').textContent = counts.abstain;
    document.getElementById('totalVotes').textContent = total;

    ['approve', 'disapprove', 'abstain'].forEach(opt => {
        const percent = total > 0 ? Math.round((counts[opt] / total) * 100) : 0;
        const bar = document.getElementById(opt + 'Bar');
        if (bar) {
            bar.style.width = percent + '%';
            bar.textContent = percent + '%';
        }
    });
}

// 6. ฟังก์ชันปิดโหวต / ล้างคะแนน / Export
function closePoll() {
    db.ref('polls/poll001').update({ status: 'closed' }).then(() => alert("🛑 ปิดการโหวตแล้ว"));
}

function clearVotes() {
    if (confirm("⚠️ ยืนยันการล้างคะแนนโหวตทั้งหมด?")) {
        db.ref('votes/poll001').remove().then(() => alert("🗑️ ล้างคะแนนเรียบร้อยแล้ว"));
    }
}

function exportToExcel() {
    db.ref('polls/poll001').once('value', (pollSnap) => {
        const currentQuestion = pollSnap.val() ? pollSnap.val().question : "ไม่ระบุหัวข้อ";
        db.ref('votes/poll001').once('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) return alert("❌ ไม่มีข้อมูล");
            const rows = Object.values(data).map(item => ({
                "หัวข้อ": currentQuestion,
                "รหัสพนักงาน": item.employeeId,
                "มติ": item.option === 'approve' ? 'เห็นชอบ' : item.option === 'disapprove' ? 'ไม่เห็นชอบ' : 'งดออกเสียง',
                "เวลา": new Date(item.timestamp).toLocaleString('th-TH')
            }));
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
            XLSX.writeFile(workbook, `Report_${Date.now()}.xlsx`);
        });
    });
}
// ฟังก์ชันล้างประวัติหัวข้อการโหวตทั้งหมด
function clearHistory() {
    if (confirm("⚠️ คุณแน่ใจใช่ไหมที่จะลบ 'ประวัติหัวข้อ' ทั้งหมด? \n(การกระทำนี้ไม่สามารถย้อนกลับได้)")) {
        db.ref('pollHistory').remove()
        .then(() => {
            alert("🗑️ ล้างประวัติเรียบร้อยแล้ว");
            // ล้างหน้าจอทันที
            document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="2" style="text-align:center;">ไม่มีประวัติการโหวต</td></tr>';
        })
        .catch((error) => alert("ผิดพลาด: " + error.message));
    }
}