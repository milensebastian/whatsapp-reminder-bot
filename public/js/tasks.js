document.addEventListener('DOMContentLoaded', () => {
  const { fetchJson, showStatus } = window.NotifyApp;
  const form = document.getElementById('taskForm');
  const list = document.getElementById('taskList');
  const departmentSelect = document.getElementById('targetDepartment');
  const yearSelect = document.getElementById('targetYear');
  const classSelect = document.getElementById('targetClass');

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

  async function loadTasks() {
    try {
      const response = await fetchJson('/api/tasks');
      const tasks = response.data || [];
      list.innerHTML = tasks.length
        ? tasks.map((task) => `
            <div class="list-item">
              <h3>${task.title}</h3>
              <p>${task.description}</p>
              <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleString()}</p>
              <p><strong>Target:</strong> ${task.targetClassName || task.targetDepartment || task.targetYear || task.targetScope}</p>
              <span class="badge">${task.priority}</span>
            </div>
          `).join('')
        : '<div class="list-item"><p>No tasks available.</p></div>';
    } catch (error) {
      list.innerHTML = `<div class="list-item"><p>${error.message}</p></div>`;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const targetScope = document.getElementById('targetScope').value;
    const assignedUsers = document.getElementById('assignedUsers').value
      .split(',')
      .map((phone) => phone.trim())
      .filter(Boolean)
      .map((phone, index) => ({ name: `Student ${index + 1}`, phone }));

    const payload = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      deadline: document.getElementById('taskDeadline').value,
      priority: document.getElementById('taskPriority').value,
      targetScope,
      assignedUsers,
      targetDepartment: departmentSelect.value || undefined,
      targetYear: yearSelect.value || undefined,
      targetClassId: classSelect.value || undefined,
      scheduleDate: document.getElementById('taskScheduleDate')?.value || undefined,
      scheduleTime: document.getElementById('taskScheduleTime')?.value || undefined,
      autoSend: true,
    };

    try {
      const response = await fetchJson('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      form.reset();
      showStatus('taskStatus', response.message || 'Task saved successfully.');
      loadTasks();
    } catch (error) {
      showStatus('taskStatus', error.message, 'error');
    }
  });

  loadFilters().catch((error) => showStatus('taskStatus', error.message, 'error'));
  loadTasks();
});
