document.addEventListener('DOMContentLoaded', () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const form = document.getElementById('announcementForm');
  const emergencyForm = document.getElementById('emergencyAlertForm');
  const list = document.getElementById('announcementList');
  const emergencyList = document.getElementById('emergencyAlertList');
  const scheduledList = document.getElementById('scheduledAnnouncementList');
  const departmentSelect = document.getElementById('announcementDepartment');
  const yearSelect = document.getElementById('announcementYear');
  const classSelect = document.getElementById('announcementClass');

  function formatTarget(item) {
    return item.targetClass?.name || item.targetClassName || item.targetDepartment || item.targetYear || item.targetScope || 'manual';
  }

  async function loadFilters() {
    const [usersRes, classesRes] = await Promise.all([
      fetchJson('/api/users?role=student'),
      fetchJson('/api/classes'),
    ]);

    const users = usersRes.data || [];
    const classes = classesRes.data || [];
    const departments = [...new Set(users.map((user) => user.department).filter(Boolean))];
    const years = [...new Set(users.map((user) => user.year).filter(Boolean))].sort((a, b) => a - b);

    departmentSelect.innerHTML = '<option value="">Select department</option>' + departments.map((item) => `<option value="${item}">${item}</option>`).join('');
    yearSelect.innerHTML = '<option value="">Select year</option>' + years.map((item) => `<option value="${item}">${item}</option>`).join('');
    classSelect.innerHTML = '<option value="">Select class</option>' + classes.map((item) => `<option value="${item._id}">${item.name}</option>`).join('');
  }

  async function loadAnnouncements() {
    try {
      const response = await fetchJson('/api/announcements');
      const items = response.data || [];
      list.innerHTML = items.length
        ? items.map((item) => `
            <div class="list-item">
              <h3>${item.title}</h3>
              <p>${item.message}</p>
              <p><strong>Target:</strong> ${item.targetClassName || item.targetDepartment || item.targetYear || item.targetScope}</p>
              <span class="badge">${item.priority}</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No announcements yet.</p></div>';
    } catch (error) {
      list.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  async function loadEmergencyAlerts() {
    try {
      const response = await fetchJson('/api/emergency-alerts');
      const items = response.data || [];
      emergencyList.innerHTML = items.length
        ? items.map((item) => `
            <div class="list-item">
              <h3>${item.title}</h3>
              <p>${item.message}</p>
              <span class="badge">${new Date(item.createdAt).toLocaleString()}</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No emergency alerts sent yet.</p></div>';
    } catch (error) {
      emergencyList.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  async function loadScheduledAnnouncements() {
    try {
      const response = await fetchJson('/api/announcements/scheduled');
      const items = response.data || [];
      scheduledList.innerHTML = items.length
        ? items.map((item) => `
            <div class="list-item">
              <h3>${item.title}</h3>
              <p>${item.message}</p>
              <p><strong>Target:</strong> ${formatTarget(item)}</p>
              <p><strong>Send Time:</strong> ${new Date(item.sendTime).toLocaleString()}</p>
              <span class="badge">${item.status}</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No scheduled broadcasts.</p></div>';
    } catch (error) {
      scheduledList.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const targetScope = document.getElementById('announcementTargetScope').value;
    const targetUsers = document.getElementById('targetUsers').value
      .split(',')
      .map((phone) => phone.trim())
      .filter(Boolean)
      .map((phone, index) => ({ name: `Student ${index + 1}`, phone }));

    const payload = {
      title: document.getElementById('announcementTitle').value,
      message: document.getElementById('announcementMessage').value,
      priority: document.getElementById('announcementPriority').value,
      targetScope,
      targetDepartment: departmentSelect.value || undefined,
      targetYear: yearSelect.value || undefined,
      targetClassId: classSelect.value || undefined,
      targetUsers,
      scheduleDate: document.getElementById('scheduleDate').value || undefined,
      scheduleTime: document.getElementById('scheduleTime').value || undefined,
      autoSend: true,
    };

    try {
      const response = await fetchJson('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      form.reset();
      showStatus('announcementStatus', response.message || 'Announcement saved successfully.');
      loadAnnouncements();
      loadScheduledAnnouncements();
    } catch (error) {
      showStatus('announcementStatus', error.message, 'error');
    }
  });

  emergencyForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const response = await fetchJson('/api/emergency-alerts', {
        method: 'POST',
        body: JSON.stringify({
          title: document.getElementById('emergencyTitle').value,
          message: document.getElementById('emergencyMessage').value,
        }),
      });

      emergencyForm.reset();
      showStatus('emergencyStatus', `${response.message}. Delivered to ${response.delivered} users.`);
      loadEmergencyAlerts();
    } catch (error) {
      showStatus('emergencyStatus', error.message, 'error');
    }
  });

  loadFilters().catch((error) => showStatus('announcementStatus', error.message, 'error'));
  loadAnnouncements();
  loadEmergencyAlerts();
  loadScheduledAnnouncements();
});
