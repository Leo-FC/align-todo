const API_URL = "http://localhost:8080";

let taskIdToDelete = null;
let taskIdToEdit = null;
let deleteModalBS = null;
let editModalBS = null;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        logout();
    } else {
        deleteModalBS = new bootstrap.Modal(document.getElementById('deleteModal'));
        editModalBS = new bootstrap.Modal(document.getElementById('editModal'));

        if (isAdmin()) {
            setupAdminPanel();
            getTasks('mine');
        } else {
            getTasks('mine');
        }
    }
});

// ==========================================
// FUNÇÕES AUXILIARES (BADGES)
// ==========================================

function getPriorityBadge(code) {
    switch(code) {
        case 1: return '<span class="badge bg-success">Baixa</span>';
        case 2: return '<span class="badge bg-primary">Média</span>';
        case 3: return '<span class="badge bg-warning text-dark">Alta</span>';
        case 4: return '<span class="badge bg-danger">Urgente</span>';
        default: return '<span class="badge bg-secondary">Indefinido</span>';
    }
}

function getStatusBadge(code) {
    switch(code) {
        case 1: return '<span class="badge border border-secondary text-secondary bg-light">Não Começou</span>';
        case 2: return '<span class="badge bg-info text-dark">Em Andamento</span>';
        case 3: return '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Concluído</span>';
        default: return '<span class="badge bg-secondary">?</span>';
    }
}

// ==========================================
// LÓGICA ADMIN
// ==========================================

function isAdmin() {
    const roles = localStorage.getItem("userRoles");
    return roles && roles.includes("ROLE_ADMIN");
}

async function setupAdminPanel() {
    document.getElementById("adminPanel").classList.remove("d-none");

    try {
        const response = await fetch(`${API_URL}/user/lista`, {
            headers: { "Authorization": localStorage.getItem("token") }
        });

        if(response.ok) {
            const users = await response.json();
            const select = document.getElementById("userFilterSelect");

            select.innerHTML = '<option value="" selected>Filtrar por Usuário específico...</option>';

            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.username;
                option.text = `${user.username} (ID: ${user.id})`;
                select.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar lista de usuários:", e);
    }
}

function setAdminView(mode, filterValue) {
    document.getElementById("btnMyTasks").classList.remove("active");
    document.getElementById("btnAllTasks").classList.remove("active");

    if (mode !== 'user') {
        document.getElementById("userFilterSelect").value = "";
    }

    const title = document.getElementById("pageTitle");

    if (mode === 'mine') {
        document.getElementById("btnMyTasks").classList.add("active");
        title.innerText = "Minhas Tarefas";
        getTasks('mine');
    }
    else if (mode === 'all') {
        document.getElementById("btnAllTasks").classList.add("active");
        title.innerText = "Todas as Tarefas do Sistema";
        getTasks('all');
    }
    else if (mode === 'user') {
        if (!filterValue) return;
        title.innerText = `Tarefas de: ${filterValue}`;
        getTasks('filter', filterValue);
    }
}

// ==========================================
// BUSCAR E RENDERIZAR
// ==========================================

async function getTasks(mode = 'mine', filterUsername = null) {
    const token = localStorage.getItem("token");
    const loadingElement = document.getElementById("loading");

    if(loadingElement) loadingElement.classList.remove("d-none");
    document.getElementById("tasksTable").classList.add("d-none");
    document.getElementById("noTasksMessage").classList.add("d-none");

    let endpoint = "/task/user";
    if (mode === 'all' || mode === 'filter') {
        endpoint = "/task/user/all";
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "GET",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 403 || response.status === 401) {
            alert("Sessão expirada ou sem permissão. Faça login novamente.");
            logout();
            return;
        }

        let tasks = await response.json();

        if (mode === 'filter' && filterUsername) {
            tasks = tasks.filter(t => t.user && t.user.username === filterUsername);
        }

        renderTasks(tasks);

    } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados.");
    } finally {
        if(loadingElement) loadingElement.classList.add("d-none");
    }
}

function renderTasks(tasks) {
    const table = document.getElementById("tasksTable");
    const tbody = document.getElementById("tasksBody");
    const thead = table.querySelector("thead tr");
    const noTasks = document.getElementById("noTasksMessage");

    tbody.innerHTML = "";

    // Lógica da coluna extra de Usuário (Admin)
    const userColumnId = "userColHeader";
    let userHeader = document.getElementById(userColumnId);

    if (isAdmin()) {
        if (!userHeader) {
            const th = document.createElement("th");
            th.id = userColumnId;
            th.innerText = "Usuário";
            // Insere antes da coluna Prioridade (agora índice 2)
            thead.insertBefore(th, thead.children[2]);
        }
    } else {
        if (userHeader) userHeader.remove();
    }

    if (!tasks || tasks.length === 0) {
        noTasks.classList.remove("d-none");
        return;
    }

    table.classList.remove("d-none");

    tasks.forEach((task, index) => {
        const safeDescription = task.description ? task.description.replace(/'/g, "\\'").replace(/"/g, '&quot;') : "";

        // Dados de Prioridade e Status
        const priorityCode = task.priority;
        const statusCode = task.status;

        const userColumnHtml = isAdmin()
            ? `<td><span class="badge bg-info text-dark">${task.user ? task.user.username : 'N/A'}</span></td>`
            : '';

        const row = `
            <tr class="align-middle">
                <td>${index + 1}</td>
                <td class="fw-bold">${task.description}</td>
                ${userColumnHtml}
                <td class="text-center">${getPriorityBadge(priorityCode)}</td>
                <td class="text-center">${getStatusBadge(statusCode)}</td>
                <td class="text-end">
                    <button class="btn btn-outline-warning btn-sm me-1" 
                        onclick="openEditModal(${task.id}, '${safeDescription}', ${priorityCode}, ${statusCode})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="openDeleteModal(${task.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// CRIAÇÃO (CREATE)
// ==========================================

function handleEnter(event) {
    if (event.key === "Enter") {
        createTask();
    }
}

async function createTask() {
    const descriptionInput = document.getElementById("taskDescription");
    const priorityInput = document.getElementById("taskPriority"); // Captura o Select

    const description = descriptionInput.value;
    const priority = priorityInput.value;
    const token = localStorage.getItem("token");

    if (!description || description.trim() === "") {
        alert("A descrição da tarefa não pode estar vazia!");
        return;
    }

    if (!priority) {
        alert("Por favor, selecione uma prioridade!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/task`, {
            method: "POST",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                description: description,
                priority: parseInt(priority) // Envia como Inteiro (singular)
            })
        });

        if (response.ok) {
            descriptionInput.value = "";
            priorityInput.value = ""; // Reseta o select

            if(isAdmin() && document.getElementById("btnAllTasks").classList.contains("active")) {
                getTasks('all');
            } else {
                getTasks('mine');
                if(isAdmin()) setAdminView('mine');
            }
        } else {
            alert("Erro ao criar tarefa.");
        }

    } catch (error) {
        console.error("Erro:", error);
        alert("Falha na comunicação com o servidor.");
    }
}

// ==========================================
// EDIÇÃO (UPDATE)
// ==========================================

function openEditModal(id, currentDescription, currentPriority, currentStatus) {
    taskIdToEdit = id;

    // Preenche os campos do modal
    document.getElementById('editTaskDescription').value = currentDescription;
    document.getElementById('editTaskPriority').value = currentPriority || 1;
    document.getElementById('editTaskStatus').value = currentStatus || 1;

    editModalBS.show();
}

async function confirmUpdateTask() {
    if (!taskIdToEdit) return;

    const newDescription = document.getElementById('editTaskDescription').value;
    const newPriority = document.getElementById('editTaskPriority').value;
    const newStatus = document.getElementById('editTaskStatus').value;

    if (!newDescription || newDescription.trim() === "") {
        alert("A descrição não pode ser vazia.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/task/${taskIdToEdit}`, {
            method: "PUT",
            headers: {
                "Authorization": localStorage.getItem("token"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                description: newDescription,
                priority: parseInt(newPriority), // Envia prioridade
                status: parseInt(newStatus)      // Envia status
            })
        });

        if (response.ok) {
            editModalBS.hide();
            refreshCurrentView();
        } else {
            alert("Erro ao atualizar tarefa.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Falha na comunicação com o servidor.");
    }
}

// ==========================================
// EXCLUSÃO (DELETE)
// ==========================================

function openDeleteModal(id) {
    taskIdToDelete = id;
    deleteModalBS.show();
}

async function confirmDeleteTask() {
    if (!taskIdToDelete) return;

    try {
        const response = await fetch(`${API_URL}/task/${taskIdToDelete}`, {
            method: "DELETE",
            headers: {
                "Authorization": localStorage.getItem("token"),
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            deleteModalBS.hide();
            refreshCurrentView();
        } else {
            alert("Erro ao deletar tarefa.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Falha na comunicação com o servidor.");
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRoles");
    window.location.href = "login.html";
}

function refreshCurrentView() {
    if (!isAdmin()) {
        getTasks('mine');
        return;
    }

    if (document.getElementById("btnAllTasks").classList.contains("active")) {
        getTasks('all');
    } else if (document.getElementById("userFilterSelect").value !== "") {
        getTasks('filter', document.getElementById("userFilterSelect").value);
    } else {
        getTasks('mine');
    }
}