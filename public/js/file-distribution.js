document.addEventListener('DOMContentLoaded', () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const form = document.getElementById('fileUploadForm');
  const classSelect = document.getElementById('fileTargetClass');
  const fileList = document.getElementById('fileList');

  async function loadClasses() {
    const response = await fetchJson('/api/classes');
    const classes = response.data || [];
    classSelect.innerHTML = '<option value="">Select class</option>' + classes.map((item) => `<option value="${item._id}">${item.name}</option>`).join('');
  }

  async function loadFiles() {
    try {
      const response = await fetchJson('/api/files');
      const files = response.data || [];
      fileList.innerHTML = files.length
        ? files.map((item) => `
            <div class="list-item">
              <h3>${item.title}</h3>
              <p><strong>Class:</strong> ${item.targetClass?.name || 'Unknown class'}</p>
              <p><a href="${item.fileUrl}" target="_blank" rel="noreferrer">Open File</a></p>
            </div>
          `).join('')
        : '<div class="list-item"><p>No files uploaded yet.</p></div>';
    } catch (error) {
      fileList.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = document.getElementById('fileInput').files[0];
    if (!file) {
      showStatus('fileStatus', 'Please choose a file to upload.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('fileTitle').value);
    formData.append('targetClass', classSelect.value);
    formData.append('file', file);

    try {
      const data = await fetchJson('/api/files', {
        method: 'POST',
        body: formData,
      });

      form.reset();
      showStatus('fileStatus', `File uploaded and sent to ${data.sentTo} students.`);
      loadFiles();
    } catch (error) {
      showStatus('fileStatus', error.message, 'error');
    }
  });

  loadClasses().catch((error) => showStatus('fileStatus', error.message, 'error'));
  loadFiles();
});
