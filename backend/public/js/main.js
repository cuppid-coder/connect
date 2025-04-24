// Authentication state
let currentUser = null;
let authToken = null;

// API endpoint templates
const endpoints = {
    auth: {
        login: '/api/users/login',
        register: '/api/users/register',
        logout: '/api/users/logout'
    },
    users: {
        profile: '/api/users/profile',
        update: '/api/users/update'
    },
    teams: {
        list: '/api/teams',
        create: '/api/teams',
        details: '/api/teams/:id'
    },
    projects: {
        list: '/api/projects',
        create: '/api/projects',
        details: '/api/projects/:id'
    },
    tasks: {
        list: '/api/tasks',
        create: '/api/tasks',
        update: '/api/tasks/:id'
    },
    messages: {
        list: '/api/messages',
        send: '/api/messages',
        thread: '/api/messages/:id'
    },
    notifications: {
        list: '/api/notifications',
        markRead: '/api/notifications/:id'
    },
    search: {
        global: '/api/search'
    },
    analytics: {
        dashboard: '/api/analytics/dashboard',
        reports: '/api/analytics/reports'
    }
};

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const emailForm = document.getElementById('email-form');
const authStatus = document.getElementById('auth-status');
const logoutButton = document.getElementById('logout');
const loginError = document.getElementById('login-error');

// Auth UI Elements
document.getElementById('google-login').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .catch(error => {
            loginError.textContent = error.message;
        });
});

document.getElementById('email-login').addEventListener('click', () => {
    emailForm.classList.remove('hidden');
    document.querySelector('.login-buttons').classList.add('hidden');
});

document.getElementById('back-to-options').addEventListener('click', () => {
    emailForm.classList.add('hidden');
    document.querySelector('.login-buttons').classList.remove('hidden');
    loginError.textContent = '';
});

document.getElementById('email-submit').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(error => {
            loginError.textContent = error.message;
        });
});

// Auth UI Toggle
document.getElementById('login-toggle').addEventListener('change', () => {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    loginError.textContent = '';
});

document.getElementById('signup-toggle').addEventListener('change', () => {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.remove('hidden');
    loginError.textContent = '';
});

// Signup form handling
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    // Reset error message
    loginError.textContent = '';

    // Validate password match
    if (password !== confirmPassword) {
        loginError.textContent = 'Passwords do not match';
        return;
    }

    try {
        // Create user with Firebase
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Update user profile with name
        await userCredential.user.updateProfile({
            displayName: name
        });

        // Clear form
        document.getElementById('signup-form').reset();
        
        // Switch back to login section
        document.getElementById('login-toggle').checked = true;
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('signup-section').classList.add('hidden');
    } catch (error) {
        loginError.textContent = error.message;
    }
});

logoutButton.addEventListener('click', () => {
    firebase.auth().signOut();
});

// API Helper Functions
async function fetchWithAuth(endpoint, options = {}) {
    if (!authToken) {
        throw new Error('No authentication token available');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    const response = await fetch(endpoint, { ...defaultOptions, ...options });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
}

// Update the Firebase auth state observer
firebase.auth().onAuthStateChanged(async (user) => {
    try {
        if (user) {
            // Get the Firebase ID token
            authToken = await user.getIdToken(true);
            currentUser = user;
            
            // Update UI
            authStatus.textContent = `Logged in as ${user.email}`;
            loginOverlay.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            
            // Register or sync user with backend
            try {
                const response = await fetchWithAuth('/api/users/auth/register-or-sync', {
                    method: 'POST',
                    body: JSON.stringify({ firebaseToken: authToken })
                });
                
                if (response.user) {
                    currentUser = response.user;
                    // Initialize socket and load data
                    initializeSocket(authToken);
                    await loadInitialData();
                }
            } catch (error) {
                console.error('Error syncing user:', error);
                showToast('Failed to sync user with backend', 'error');
            }
        } else {
            // User is signed out
            authToken = null;
            currentUser = null;
            authStatus.textContent = 'Not logged in';
            loginOverlay.classList.remove('hidden');
            logoutButton.classList.add('hidden');
        }
    } catch (error) {
        console.error('Auth state change error:', error);
        showToast('Authentication error occurred', 'error');
    }
});

// Initialize endpoint list
document.querySelectorAll('.endpoint-list li').forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;
        const sectionEndpoints = endpoints[section];
        if (sectionEndpoints) {
            const endpoint = document.getElementById('endpoint');
            endpoint.value = Object.values(sectionEndpoints)[0];
        }
    });
});

// API request handling
document.getElementById('send-request').addEventListener('click', async () => {
    if (!authToken) {
        document.getElementById('response').textContent = 'Please log in first';
        return;
    }

    const method = document.getElementById('method').value;
    const endpoint = document.getElementById('endpoint').value;
    const requestBody = document.getElementById('request-body').value;
    const responseElement = document.getElementById('response');

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };

        const options = {
            method,
            headers
        };

        if (method !== 'GET' && requestBody) {
            options.body = requestBody;
        }

        const response = await fetch(endpoint, options);
        const data = await response.json();
        
        responseElement.textContent = JSON.stringify(data, null, 2);
        responseElement.className = response.ok ? 'success' : 'error';
    } catch (error) {
        responseElement.textContent = `Error: ${error.message}`;
        responseElement.className = 'error';
    }
});

// Messaging functionality
let socket = null;
let currentChat = null;
let contacts = [];
let chats = {};
let typingTimeout = null;

// Initialize the socket connection
function initializeSocket(token) {
    socket = io({
        auth: {
            token
        }
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('user_status_changed', handleUserStatusChange);
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_update', handleFriendRequestUpdate);
    socket.on('message_request_update', handleMessageRequestUpdate);
    socket.on('direct_message_request', handleDirectMessageRequest);
}

// Event Handlers
async function handleNewMessage(message) {
    if (chats[message.chatId]) {
        chats[message.chatId].messages.push(message);
        if (currentChat === message.chatId) {
            renderMessages(message.chatId);
            markMessagesAsRead([message._id]);
        }
    } else {
        await fetchUserChats();
    }
}

function handleUserTyping({ chatId, userId }) {
    if (currentChat === chatId && userId !== currentUser._id) {
        document.getElementById('chatStatus').textContent = 'Typing...';
    }
}

function handleUserStopTyping({ chatId, userId }) {
    if (currentChat === chatId && userId !== currentUser._id) {
        updateChatStatus();
    }
}

function handleUserStatusChange({ userId, status }) {
    // Update status in contacts list
    const contactItem = document.querySelector(`[data-contact-id="${userId}"]`);
    if (contactItem) {
        const indicator = contactItem.querySelector('.online-indicator');
        indicator.className = `online-indicator ${status}`;
    }

    // Update status in current chat if applicable
    if (currentChat && chats[currentChat]?.participants?.includes(userId)) {
        updateChatStatus();
    }
}

async function handleContactRequest() {
    await fetchContacts();
}

async function handleContactAccepted() {
    await fetchContacts();
}

function handleFriendRequestReceived(data) {
    showToast(`New friend request from ${data.from.name}`);
    fetchPendingRequests();
}

function handleFriendRequestUpdate(data) {
    if (data.status === 'accepted') {
        showToast(`${data.from.name} accepted your friend request`);
        fetchContacts();
    }
    fetchPendingRequests();
}

function handleDirectMessageRequest(data) {
    showToast(`${data.from.name} wants to message you`);
    fetchPendingRequests();
}

function handleMessageRequestUpdate(data) {
    if (data.status === 'accepted') {
        showToast(`${data.from.name} accepted your message request`);
        fetchUserChats();
    }
    fetchPendingRequests();
}

// UI Event Listeners
document.getElementById('statusSelect').addEventListener('change', async (e) => {
    try {
        await fetchWithAuth(`/api/users/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: e.target.value })
        });
    } catch (error) {
        console.error('Error updating status:', error);
    }
});

document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !currentChat) return;

    try {
        await sendMessage(content);
        input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

document.getElementById('messageInput').addEventListener('input', () => {
    if (!currentChat) return;

    socket.emit('typing', { chatId: currentChat });
    
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    typingTimeout = setTimeout(() => {
        socket.emit('stop_typing', { chatId: currentChat });
    }, 1000);
});

document.getElementById('addContactBtn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('addContactModal'));
    modal.show();
});

document.getElementById('newChatBtn').addEventListener('click', () => {
    loadContactsForChat();
    const modal = new bootstrap.Modal(document.getElementById('newChatModal'));
    modal.show();
});

document.getElementById('searchUserInput').addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (!query) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    try {
        const users = await searchUsers(query);
        renderSearchResults(users);
    } catch (error) {
        console.error('Error searching users:', error);
    }
}, 300));

document.getElementById('createChatBtn').addEventListener('click', async () => {
    const selectedIds = Array.from(document.getElementById('selectedMembers').children)
        .map(el => el.dataset.userId);
    
    if (selectedIds.length === 0) return;

    try {
        const type = document.getElementById('groupChat').checked ? 'group' : 'private';
        await createChat(selectedIds, type);
        bootstrap.Modal.getInstance(document.getElementById('newChatModal')).hide();
    } catch (error) {
        console.error('Error creating chat:', error);
    }
});

// API Functions
async function loadInitialData() {
    try {
        const userData = await fetchWithAuth('/api/users/me');
        currentUser = userData;
        updateUserInfo();
        
        await Promise.all([
            fetchContacts(),
            fetchUserChats(),
            fetchOnlineUsers(),
            fetchPendingRequests()
        ]);

        initializeSocket(localStorage.getItem('token'));
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

async function fetchContacts() {
    try {
        const data = await fetchWithAuth('/api/users/contacts');
        contacts = data.contacts;
        renderContacts();
    } catch (error) {
        console.error('Error fetching contacts:', error);
    }
}

async function fetchUserChats() {
    try {
        const data = await fetchWithAuth(`/api/messages/user/${currentUser._id}/chats`);
        chats = data;
        renderChats();
    } catch (error) {
        console.error('Error fetching chats:', error);
    }
}

async function fetchOnlineUsers() {
    try {
        const data = await fetchWithAuth('/api/notifications/online-users');
        renderOnlineUsers(data);
    } catch (error) {
        console.error('Error fetching online users:', error);
    }
}

async function fetchPendingRequests() {
    try {
        const [friendRequests, messageRequests] = await Promise.all([
            fetchWithAuth('/api/notifications/pending-requests'),
            fetchWithAuth('/api/notifications/message-requests')
        ]);
        renderFriendRequests(friendRequests);
        renderMessageRequests(messageRequests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
    }
}

async function searchUsers(query) {
    try {
        const data = await fetchWithAuth(`/api/users/search?query=${encodeURIComponent(query)}`);
        return data;
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

async function sendContactRequest(userId) {
    try {
        await fetchWithAuth('/api/users/contacts/request', {
            method: 'POST',
            body: JSON.stringify({ toUserId: userId })
        });
        bootstrap.Modal.getInstance(document.getElementById('addContactModal')).hide();
    } catch (error) {
        console.error('Error sending contact request:', error);
    }
}

async function handleContactRequest(requestId, action) {
    try {
        await fetchWithAuth('/api/users/contacts/handle-request', {
            method: 'POST',
            body: JSON.stringify({ requestId, action })
        });
        await fetchContacts();
    } catch (error) {
        console.error('Error handling contact request:', error);
    }
}

async function createChat(userIds, type) {
    try {
        const data = await fetchWithAuth('/api/messages/chat', {
            method: 'POST',
            body: JSON.stringify({
                users: userIds,
                type,
                name: type === 'group' ? 'New Group' : undefined
            })
        });
        await fetchUserChats();
        selectChat(data.chatId);
    } catch (error) {
        console.error('Error creating chat:', error);
    }
}

async function sendMessage(content) {
    try {
        await fetchWithAuth('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
                content,
                chatId: currentChat
            })
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function markMessagesAsRead(messageIds) {
    try {
        await fetchWithAuth('/api/messages/read', {
            method: 'PUT',
            body: JSON.stringify({ messageIds })
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// UI Rendering Functions
function updateUserInfo() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userInitial').textContent = currentUser.name.charAt(0);
    document.getElementById('statusSelect').value = currentUser.status;
}

function renderContacts() {
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = contacts.map(contact => `
        <div class="list-group-item" data-contact-id="${contact.user._id}">
            <div class="d-flex align-items-center">
                <span class="online-indicator ${contact.user.status}"></span>
                <div class="user-info">
                    <h6 class="mb-0">${contact.user.name}</h6>
                    <small class="text-muted">${contact.user.email}</small>
                </div>
            </div>
        </div>
    `).join('');
}

function renderChats() {
    const chatsList = document.getElementById('chatsList');
    chatsList.innerHTML = Object.entries(chats).map(([chatId, chat]) => {
        const otherUser = chat.participants?.find(p => p._id !== currentUser._id);
        const name = chat.type === 'group' ? chat.name : otherUser?.name;
        const lastMessage = chat.messages[chat.messages.length - 1];
        
        return `
            <div class="list-group-item ${currentChat === chatId ? 'active' : ''}" 
                 onclick="selectChat('${chatId}')" data-chat-id="${chatId}">
                <div class="d-flex justify-content-between">
                    <h6 class="mb-1">${name}</h6>
                    <small>${formatDate(lastMessage?.createdAt)}</small>
                </div>
                <p class="mb-1 text-truncate">${lastMessage?.content || 'No messages yet'}</p>
                ${chat.unreadCount ? `<span class="badge bg-primary">${chat.unreadCount}</span>` : ''}
            </div>
        `;
    }).join('');
}

function renderMessages(chatId) {
    const messagesContainer = document.getElementById('messagesContainer');
    const chat = chats[chatId];
    
    if (!chat) return;

    messagesContainer.innerHTML = chat.messages.map(message => `
        <div class="message ${message.sender._id === currentUser._id ? 'own' : ''}">
            <div class="message-content">
                ${message.content}
                <div class="message-time">
                    ${formatDate(message.createdAt)}
                    ${message.sender._id === currentUser._id ? `
                        <span class="message-status ${message.readBy.length > 1 ? 'read' : ''}">
                            ${message.readBy.length > 1 ? '✓✓' : '✓'}
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderOnlineUsers(users) {
    const onlineUsersList = document.getElementById('onlineUsersList');
    onlineUsersList.innerHTML = users.map(user => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    ${user.avatar 
                        ? `<img src="${user.avatar}" alt="${user.name}" class="avatar-sm me-2">` 
                        : `<div class="avatar-placeholder-sm me-2">${user.name.charAt(0)}</div>`
                    }
                    <span>${user.name}</span>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="sendFriendRequest('${user.userId}')">
                        Add Friend
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="requestDirectMessage('${user.userId}')">
                        Message
                    </button>
                </div>
            </div>
        </div>
    `).join('') || '<div class="list-group-item">No users online</div>';
}

function renderFriendRequests(requests) {
    const friendRequestsList = document.getElementById('friendRequestsList');
    friendRequestsList.innerHTML = requests.map(request => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    ${request.reference.id.avatar 
                        ? `<img src="${request.reference.id.avatar}" alt="${request.reference.id.name}" class="avatar-sm me-2">` 
                        : `<div class="avatar-placeholder-sm me-2">${request.reference.id.name.charAt(0)}</div>`
                    }
                    <span>${request.reference.id.name}</span>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-success" onclick="handleFriendRequestResponse('${request._id}', true)">
                        Accept
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="handleFriendRequestResponse('${request._id}', false)">
                        Decline
                    </button>
                </div>
            </div>
        </div>
    `).join('') || '<div class="list-group-item">No pending friend requests</div>';
}

function renderMessageRequests(requests) {
    const messageRequestsList = document.getElementById('messageRequestsList');
    messageRequestsList.innerHTML = requests.map(request => `
        <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    ${request.reference.id.avatar 
                        ? `<img src="${request.reference.id.avatar}" alt="${request.reference.id.name}" class="avatar-sm me-2">` 
                        : `<div class="avatar-placeholder-sm me-2">${request.reference.id.name.charAt(0)}</div>`
                    }
                    <span>${request.reference.id.name}</span>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-success" onclick="acceptMessageRequest('${request._id}', '${request.reference.id._id}')">
                        Accept
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="declineMessageRequest('${request._id}')">
                        Decline
                    </button>
                </div>
            </div>
        </div>
    `).join('') || '<div class="list-group-item">No pending message requests</div>';
}

async function sendFriendRequest(userId) {
    try {
        await fetchWithAuth('/api/users/demo/friend-request', {
            method: 'POST',
            body: JSON.stringify({ targetUserId: userId })
        });
        showToast('Friend request sent successfully');
    } catch (error) {
        console.error('Error sending friend request:', error);
        showToast('Failed to send friend request', 'error');
    }
}

async function handleFriendRequestResponse(requestId, accept) {
    try {
        await fetchWithAuth('/api/users/demo/handle-friend-request', {
            method: 'POST',
            body: JSON.stringify({ requestId, accept })
        });
        await fetchPendingRequests();
        showToast(`Friend request ${accept ? 'accepted' : 'declined'}`);
    } catch (error) {
        console.error('Error handling friend request:', error);
        showToast('Failed to handle friend request', 'error');
    }
}

async function requestDirectMessage(userId) {
    try {
        await fetchWithAuth('/api/users/demo/message-request', {
            method: 'POST',
            body: JSON.stringify({ targetUserId: userId })
        });
        showToast('Message request sent successfully');
    } catch (error) {
        console.error('Error sending message request:', error);
        showToast('Failed to send message request', 'error');
    }
}

// Simple toast notification function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} position-fixed bottom-0 end-0 m-3`;
    toast.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
    `;
    document.body.appendChild(toast);
    new bootstrap.Toast(toast).show();
    setTimeout(() => toast.remove(), 3000);
}

// API Documentation Page Enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize syntax highlighting
    hljs.highlightAll();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active state to sidebar links
    const observerOptions = {
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section[id]').forEach(section => {
        observer.observe(section);
    });

    // Add copy button to code blocks
    document.querySelectorAll('pre code').forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        
        block.parentNode.style.position = 'relative';
        block.parentNode.appendChild(button);

        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(block.textContent);
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        });
    });
});