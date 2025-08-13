// 전역 객체에 초기화 함수 등록
window.initEmergencyModal = function() {
    initEmergencyCalendar();
    
    document.getElementById("emergencyApplyBtn").addEventListener("click", () => {
        const content = document.getElementById("emergencyContent").value;
        const selectedEmergencyDateEl = document.getElementById("selectedEmergencyDate");
        const selectedDate = selectedEmergencyDateEl.dataset.date || new Date().toISOString().split('T')[0];

        if (content.trim() !== "") {
            addEmergencyApplication(selectedDate, content);
            alert("비상 점검이 신청되었습니다.");
            closeModal(); // main.html에 정의된 전역 함수 사용
        } else {
            alert("필요 점검 내역을 작성해주세요.");
        }
    });
};

function addEmergencyApplication(date, content) {
    if (window.emergencyApplications.length >= 10) window.emergencyApplications.shift();
    window.emergencyApplications.push({ date, content, timestamp: new Date().toISOString() });
    updateEmergencyBadge();
}

function updateEmergencyBadge() {
    const emergencyIcon = document.getElementById("emergencyIcon");
    if (!emergencyIcon) return;

    emergencyIcon.querySelector(".badge")?.remove();
    const count = window.emergencyApplications.length;

    if (count > 0) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = count;
      emergencyIcon.appendChild(badge);
    }
}

function initEmergencyCalendar() {
    const calendar = document.getElementById("emergencyCalendar");
    if(!calendar) return;
    calendar.innerHTML = "";
    const selectedDateElement = document.getElementById("selectedEmergencyDate");
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const dayElement = document.createElement("div");
        dayElement.classList.add('calendar-day');
        dayElement.textContent = date.getDate();
        dayElement.dataset.date = dateString;
        
        dayElement.addEventListener('click', (e) => {
            calendar.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedDateElement.textContent = e.target.dataset.date;
            selectedDateElement.dataset.date = e.target.dataset.date;
        });

        calendar.appendChild(dayElement);
    }
    
    const firstDay = calendar.firstChild;
    firstDay.classList.add('selected');
    selectedDateElement.textContent = firstDay.dataset.date;
    selectedDateElement.dataset.date = firstDay.dataset.date;
}