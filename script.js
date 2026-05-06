const USERNAME = 'adrikapandey';
const GITHUB_API = 'https://api.github.com';

// Fetch user data and populate dashboard
async function initDashboard() {
    try {
        // Fetch user data
        const userResponse = await fetch(`${GITHUB_API}/users/${USERNAME}`);
        const userData = await userResponse.json();
        
        populateHeader(userData);
        populateStats(userData);
        
        // Fetch repositories
        const reposResponse = await fetch(`${GITHUB_API}/users/${USERNAME}/repos?sort=stars&per_page=30`);
        const repos = await reposResponse.json();
        
        populateProjects(repos);
        populateLanguages(repos);
        
        // Fetch events for activity
        const eventsResponse = await fetch(`${GITHUB_API}/users/${USERNAME}/events/public?per_page=10`);
        const events = await eventsResponse.json();
        
        populateActivity(events);
        
        // Update last refresh time
        updateRefreshTime();
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function populateHeader(userData) {
    document.getElementById('avatar').src = userData.avatar_url;
    document.getElementById('username').textContent = userData.name || userData.login;
    document.getElementById('bio').textContent = userData.bio || 'GitHub Developer';
    
    const githubLink = document.getElementById('github-link');
    const profileLink = document.getElementById('profile-link');
    
    githubLink.href = userData.html_url;
    profileLink.href = userData.html_url;
}

function populateStats(userData) {
    document.getElementById('public-repos').textContent = userData.public_repos;
    document.getElementById('followers').textContent = userData.followers;
    document.getElementById('following').textContent = userData.following;
    document.getElementById('gists').textContent = userData.public_gists;
}

function populateProjects(repos) {
    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = '';
    
    if (repos.length === 0) {
        projectsGrid.innerHTML = '<p class="loading">No public repositories yet</p>';
        return;
    }
    
    repos.slice(0, 6).forEach(repo => {
        const card = createProjectCard(repo);
        projectsGrid.appendChild(card);
    });
}

function createProjectCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const language = repo.language || 'Unknown';
    
    card.innerHTML = `
        <a href="${repo.html_url}" target="_blank" class="project-name">${repo.name}</a>
        <p class="project-description">${repo.description || 'No description provided'}</p>
        <div class="project-meta">
            <span class="project-stat">⭐ ${stars}</span>
            <span class="project-stat">🔀 ${forks}</span>
            <span class="language-tag">${language}</span>
        </div>
    `;
    
    card.addEventListener('click', () => window.open(repo.html_url, '_blank'));
    
    return card;
}

function populateLanguages(repos) {
    const languageMap = {};
    
    repos.forEach(repo => {
        if (repo.language) {
            languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
        }
    });
    
    const sortedLanguages = Object.entries(languageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    const total = sortedLanguages.reduce((sum, [_, count]) => sum + count, 0);
    
    const languagesContainer = document.getElementById('languages-container');
    languagesContainer.innerHTML = '';
    
    if (sortedLanguages.length === 0) {
        languagesContainer.innerHTML = '<p class="loading">No languages found</p>';
        return;
    }
    
    sortedLanguages.forEach(([language, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'language-item';
        item.innerHTML = `
            <div class="language-name">${language}</div>
            <div class="language-percent">${percentage}%</div>
            <div class="language-bar">
                <div class="language-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        languagesContainer.appendChild(item);
    });
}

function populateActivity(events) {
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = '';
    
    if (events.length === 0) {
        activityFeed.innerHTML = '<p class="loading">No recent activity</p>';
        return;
    }
    
    events.slice(0, 8).forEach(event => {
        const item = createActivityItem(event);
        activityFeed.appendChild(item);
    });
}

function createActivityItem(event) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const eventType = event.type;
    const repo = event.repo.name;
    const timestamp = new Date(event.created_at);
    const timeStr = formatTime(timestamp);
    
    let eventText = '';
    let eventTypeLabel = '';
    
    switch (eventType) {
        case 'PushEvent':
            eventText = `Pushed to <strong>${repo}</strong>`;
            eventTypeLabel = 'Push';
            break;
        case 'PullRequestEvent':
            eventText = `${event.payload.action} pull request in <strong>${repo}</strong>`;
            eventTypeLabel = 'PR';
            break;
        case 'CreateEvent':
            eventText = `Created ${event.payload.ref_type} in <strong>${repo}</strong>`;
            eventTypeLabel = 'Create';
            break;
        case 'IssuesEvent':
            eventText = `${event.payload.action} issue in <strong>${repo}</strong>`;
            eventTypeLabel = 'Issue';
            break;
        case 'WatchEvent':
            eventText = `Starred <strong>${repo}</strong>`;
            eventTypeLabel = 'Star';
            break;
        case 'ForkEvent':
            eventText = `Forked <strong>${repo}</strong>`;
            eventTypeLabel = 'Fork';
            break;
        default:
            eventText = `${eventType} in <strong>${repo}</strong>`;
            eventTypeLabel = eventType.replace('Event', '');
    }
    
    item.innerHTML = `
        <div class="activity-type">${eventTypeLabel}</div>
        <div class="activity-text">${eventText}</div>
        <div class="activity-time">${timeStr}</div>
    `;
    
    return item;
}

function formatTime(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function updateRefreshTime() {
    const now = new Date();
    document.getElementById('last-update').textContent = 
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    startRefreshTimer();
}

function startRefreshTimer() {
    let secondsLeft = 300; // 5 minutes
    
    const timer = setInterval(() => {
        secondsLeft--;
        
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        
        document.getElementById('refresh-timer').textContent = 
            `${minutes}m ${seconds}s`;
        
        if (secondsLeft === 0) {
            clearInterval(timer);
            initDashboard();
        }
    }, 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);

// Optional: Refresh on visibility change (when tab becomes active)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        initDashboard();
    }
});
