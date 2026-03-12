document.addEventListener('DOMContentLoaded', () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const manualForm = document.getElementById('userForm');
  const uploadForm = document.getElementById('csvUploadForm');
  const userList = document.getElementById('userList');

  async function loadUsers() {
    try {
      const response = await fetchJson('/api/users?role=student');
      const users = response.data || [];

      userList.innerHTML = users.length
        ? users.map((user) => `
            <div class="list-item">
              <h3>${user.name}</h3>
              <p><strong>Phone:</strong> ${user.phone}</p>
              <p><strong>Department:</strong> ${user.department || 'Not set'}</p>
              <p><strong>Year:</strong> ${user.year || 'Not set'}</p>
              <span class="badge">${user.role}</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No students registered yet.</p></div>';
    } catch (error) {
      userList.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  manualForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      await fetchJson('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('studentName').value,
          phone: document.getElementById('studentPhone').value,
          department: document.getElementById('studentDepartment').value,
          year: document.getElementById('studentYear').value || undefined,
        }),
      });

      manualForm.reset();
      showStatus('userStatus', 'Student saved successfully.');
      loadUsers();
    } catch (error) {
      showStatus('userStatus', error.message, 'error');
    }
  });

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('studentCsv');
    if (!fileInput.files.length) {
      showStatus('uploadStatus', 'Please select a CSV file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const data = await fetchJson('/api/users/upload', {
        method: 'POST',
        body: formData,
      });

      uploadForm.reset();
      showStatus('uploadStatus', `Import complete. Imported ${data.data.importedCount}, skipped ${data.data.skippedCount}.`);
      loadUsers();
    } catch (error) {
      showStatus('uploadStatus', error.message, 'error');
    }
  });

  loadUsers();
});
