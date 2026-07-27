const API_BASE = '';

async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
    const headers = {};
    const token = localStorage.getItem('token');
    
    if(token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if(!isFormData && body) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers
    };

    if(body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        if(!response.ok) {
            return { error: data.error || 'Something went wrong' };
        }
        return data;
    } catch(err) {
        return { error: 'Network error. Make sure backend is running.' };
    }
}

function showError(msg) {
    const errDiv = document.getElementById('error-msg');
    if(errDiv) {
        errDiv.innerText = msg;
        errDiv.classList.remove('d-none');
        setTimeout(() => errDiv.classList.add('d-none'), 3000);
    } else {
        alert(msg);
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Fetch Plans for Landing page
async function fetchPlans() {
    const container = document.getElementById('plans-container');
    if(!container) return;
    
    const res = await apiCall('/api/plans');
    if(res.error) {
        container.innerHTML = `<div class="text-danger">Failed to load plans.</div>`;
        return;
    }
    
    let html = '';
    res.forEach(p => {
        html += `
        <div class="glass-panel plan-card">
            <h3>${p.name}</h3>
            <div class="plan-price text-gradient">${p.amount} USDT</div>
            <ul class="plan-details">
                <li>Daily Return: <strong>${p.daily_percent}%</strong></li>
                <li>Duration: <strong>${p.duration_days} Days</strong></li>
                <li>Total Return: <strong>${(p.amount * (p.daily_percent/100) * p.duration_days).toFixed(2)} USDT</strong></li>
            </ul>
            <a href="register.html" class="btn btn-outline">Select Plan</a>
        </div>
        `;
    });
    container.innerHTML = html;
}
