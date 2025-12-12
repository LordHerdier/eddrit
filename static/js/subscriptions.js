class SubscriptionManager {
    constructor() {
        this.storageKey = 'eddrit_subscriptions';
        this.subscriptions = this._loadSubscriptions();
        this.init();
    }

    _loadSubscriptions() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    _saveSubscriptions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.subscriptions));
    }

    init() {
        this.renderHeaderList();
        this.updateCurrentPageButton();
        this.bindHomeLink();
        this.handleDefaultRoute();
    }

    handleDefaultRoute() {
        if (window.location.pathname === '/' && this.subscriptions.length > 0) {
            this.navigateToFeed();
        }
    }

    bindHomeLink() {
        const homeLink = document.getElementById('nav-home');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                // If we have subscriptions, use our custom navigation
                if (this.subscriptions.length > 0) {
                    e.preventDefault();
                    this.navigateToFeed();
                }
                // Else let it fall through to href="/" which will just go to popular (if we didn't have subscriptions)
                // actually, if we don't have subscriptions, "/" currently displays popular content but we might want to keep it that way.
                // If subscriptions length is 0, handleDefaultRoute won't do anything, so "/" renders popular.
            });
        }
    }

    navigateToFeed() {
        if (this.subscriptions.length === 0) {
            alert('You have no subscriptions yet!');
            return;
        }
        const multiUrl = `/r/${this.subscriptions.join('+')}`;
        window.location.href = multiUrl;
    }

    isSubscribed(subreddit) {
        return this.subscriptions.includes(subreddit.toLowerCase());
    }

    toggleSubscription(subreddit) {
        const lowerSub = subreddit.toLowerCase();
        if (this.isSubscribed(lowerSub)) {
            this.subscriptions = this.subscriptions.filter(s => s !== lowerSub);
        } else {
            this.subscriptions.push(lowerSub);
            this.subscriptions.sort();
        }
        this._saveSubscriptions();

        this.renderHeaderList();
        this.updateCurrentPageButton();
    }

    renderHeaderList() {
        const container = document.getElementById('subscriptions-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.subscriptions.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.innerHTML = '<small>No subscriptions</small>';
            container.appendChild(emptyItem);
            return;
        }

        this.subscriptions.forEach(sub => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/r/${sub}`;
            a.textContent = `r/${sub}`;
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    updateCurrentPageButton() {
        const button = document.getElementById('subscribe-button');
        if (!button) return;

        const currentSubreddit = button.dataset.subreddit;
        if (!currentSubreddit) return;

        const isSubbed = this.isSubscribed(currentSubreddit);
        button.textContent = isSubbed ? 'Unsubscribe' : 'Subscribe';

        if (isSubbed) {
            button.classList.add('outline');
        } else {
            button.classList.remove('outline');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionManager = new SubscriptionManager();
});
