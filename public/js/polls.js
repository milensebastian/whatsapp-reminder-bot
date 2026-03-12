document.addEventListener('DOMContentLoaded', () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const form = document.getElementById('pollForm');
  const classSelect = document.getElementById('pollTargetClass');
  const pollList = document.getElementById('pollList');

  async function loadClasses() {
    const response = await fetchJson('/api/classes');
    const classes = response.data || [];
    classSelect.innerHTML = '<option value="">Select class</option>' + classes.map((item) => `<option value="${item._id}">${item.name}</option>`).join('');
  }

  async function loadPolls() {
    try {
      const response = await fetchJson('/api/polls');
      const polls = response.data || [];
      pollList.innerHTML = polls.length
        ? polls.map((poll) => `
            <div class="list-item">
              <h3>${poll.question}</h3>
              <p><strong>Class:</strong> ${poll.targetClass?.name || 'Unknown class'}</p>
              <p><strong>Options:</strong> ${poll.options.join(', ')}</p>
              <span class="badge">${poll.votes.length} votes</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No polls created yet.</p></div>';
    } catch (error) {
      pollList.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const options = [
      document.getElementById('pollOption1').value,
      document.getElementById('pollOption2').value,
      document.getElementById('pollOption3').value,
    ].map((value) => value.trim()).filter(Boolean);

    try {
      await fetchJson('/api/polls', {
        method: 'POST',
        body: JSON.stringify({
          question: document.getElementById('pollQuestion').value,
          options,
          targetClass: classSelect.value,
        }),
      });

      form.reset();
      showStatus('pollStatus', 'Poll created and sent to the class.');
      loadPolls();
    } catch (error) {
      showStatus('pollStatus', error.message, 'error');
    }
  });

  loadClasses().catch((error) => showStatus('pollStatus', error.message, 'error'));
  loadPolls();
});
