document.addEventListener('DOMContentLoaded', () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const classForm = document.getElementById('classForm');
  const classList = document.getElementById('classList');
  let students = [];

  function studentOptions(excludedIds = []) {
    return '<option value="">Select student</option>' + students
      .filter((student) => !excludedIds.includes(student._id))
      .map((student) => `<option value="${student._id}">${student.name} (${student.phone})</option>`)
      .join('');
  }

  async function loadStudents() {
    const response = await fetchJson('/api/users?role=student');
    students = response.data || [];
  }

  async function loadClasses() {
    try {
      const response = await fetchJson('/api/classes');
      const classes = response.data || [];
      classList.innerHTML = classes.length
        ? classes.map((item) => {
            const memberIds = (item.members || []).map((member) => member._id);
            return `
              <div class="list-item">
                <label>Name<input data-update-name="${item._id}" value="${item.name}"></label>
                <label>Department<input data-update-department="${item._id}" value="${item.department}"></label>
                <label>Year<input data-update-year="${item._id}" type="number" min="1" value="${item.year}"></label>
                <p><strong>Members:</strong></p>
                <div class="list">
                  ${(item.members || []).map((member) => `
                    <div class="log-item">
                      <h3>${member.name}</h3>
                      <p>${member.phone} · ${member.department || 'No department'} · Year ${member.year || '-'}</p>
                      <button data-remove-student="${item._id}" data-user-id="${member._id}" class="secondary" style="margin-top:8px;">Remove Student</button>
                    </div>
                  `).join('') || '<div class="log-item"><p>No students in class.</p></div>'}
                </div>
                <label>Add Student
                  <select data-add-student-select="${item._id}">${studentOptions(memberIds)}</select>
                </label>
                <div class="content-grid">
                  <button data-add-student="${item._id}">Add Student</button>
                  <button data-save-class="${item._id}" class="secondary">Save Class</button>
                  <button data-delete-class="${item._id}" class="secondary">Delete Class</button>
                </div>
              </div>
            `;
          }).join('')
        : '<div class="list-item"><p>No classes created yet.</p></div>';
    } catch (error) {
      classList.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  classForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      await fetchJson('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('className').value,
          department: document.getElementById('classDepartment').value,
          year: Number(document.getElementById('classYear').value),
          members: [],
        }),
      });

      classForm.reset();
      showStatus('classStatus', 'Class created successfully.');
      await loadClasses();
    } catch (error) {
      showStatus('classStatus', error.message, 'error');
    }
  });

  classList.addEventListener('click', async (event) => {
    const addId = event.target.dataset.addStudent;
    const removeId = event.target.dataset.removeStudent;
    const saveId = event.target.dataset.saveClass;
    const deleteId = event.target.dataset.deleteClass;

    try {
      if (addId) {
        const select = document.querySelector(`[data-add-student-select="${addId}"]`);
        if (!select.value) throw new Error('Select a student first');
        await fetchJson(`/api/classes/${addId}/add-student`, {
          method: 'POST',
          body: JSON.stringify({ userId: select.value }),
        });
      }

      if (removeId) {
        await fetchJson(`/api/classes/${removeId}/remove-student`, {
          method: 'POST',
          body: JSON.stringify({ userId: event.target.dataset.userId }),
        });
      }

      if (saveId) {
        await fetchJson(`/api/classes/${saveId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: document.querySelector(`[data-update-name="${saveId}"]`).value,
            department: document.querySelector(`[data-update-department="${saveId}"]`).value,
            year: Number(document.querySelector(`[data-update-year="${saveId}"]`).value),
          }),
        });
        showStatus('classStatus', 'Class updated successfully.');
      }

      if (deleteId) {
        await fetchJson(`/api/classes/${deleteId}`, { method: 'DELETE' });
        showStatus('classStatus', 'Class deleted successfully.');
      }

      await loadStudents();
      await loadClasses();
    } catch (error) {
      showStatus('classStatus', error.message, 'error');
    }
  });

  Promise.all([loadStudents(), loadClasses()]).catch((error) => {
    showStatus('classStatus', error.message, 'error');
  });
});
