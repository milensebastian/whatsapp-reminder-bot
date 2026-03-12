document.addEventListener('DOMContentLoaded', async () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const form = document.getElementById('reminderLookupForm');
  const list = document.getElementById('reminderList');

  async function loadReminders(phone = document.getElementById('lookupPhone').value.trim()) {
    if (!phone) {
      list.innerHTML = '<div class="list-item"><p>Enter a phone number to view reminders.</p></div>';
      return false;
    }

    try {
      const response = await fetchJson(`/api/reminders/${encodeURIComponent(phone)}`);
      const reminders = response.data || [];
      list.innerHTML = reminders.length
        ? reminders.map((item) => `
            <div class="list-item">
              <h3>${item.message}</h3>
              <p>${new Date(item.reminderTime).toLocaleString()}</p>
              <span class="badge">${item.repeatType}</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No reminders found for this user.</p></div>';
      return true;
    } catch (error) {
      list.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
      return false;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showStatus('reminderStatus', 'Loading reminders...');
    const loaded = await loadReminders();
    showStatus(
      'reminderStatus',
      loaded ? 'Reminder list updated.' : 'Could not load reminders.',
      loaded ? 'success' : 'error'
    );
  });
});
