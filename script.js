class NPRExchange {
    constructor() {
        this.rates = {
            USD: 0.0075,
            INR: 0.62,
            EUR: 0.0069,
            GBP: 0.0059,
            AUD: 0.0114,
            JPY: 1.12
        };
        
        this.lastUpdated = new Date();
        this.updateInterval = 3600000; // 1 hour
        this.autoUpdate = true;
        this.currentAmount = 1000;
        
        this.init();
    }
    
    init() {
        this.loadFromCache();
        this.bindEvents();
        this.updateDisplay();
        this.updateTimeDisplay();
        this.startAutoUpdate();
        this.populateRatesTable();
        
        // Initial conversion
        this.convertAll();
    }
    
    bindEvents() {
        // Amount slider
        const amountSlider = document.getElementById('amountSlider');
        const amountInput = document.getElementById('amountInput');
        const displayAmount = document.getElementById('displayAmount');
        
        amountSlider.addEventListener('input', (e) => {
            this.currentAmount = parseInt(e.target.value);
            amountInput.value = this.currentAmount;
            displayAmount.textContent = this.formatNumber(this.currentAmount);
            this.convertAll();
        });
        
        amountInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 100;
            if (value < 100) value = 100;
            if (value > 1000000) value = 1000000;
            
            this.currentAmount = value;
            amountSlider.value = value;
            displayAmount.textContent = this.formatNumber(value);
            this.convertAll();
        });
        
        // Refresh button
        document.getElementById('refreshRates').addEventListener('click', (e) => {
            e.preventDefault();
            this.fetchLatestRates();
        });
        
        // Auto update toggle
        document.getElementById('autoUpdateBtn').addEventListener('click', () => {
            this.toggleAutoUpdate();
        });
        
        // Currency card clicks for reverse conversion
        document.querySelectorAll('.currency-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const currency = card.dataset.currency;
                this.reverseConversion(currency);
            });
        });
    }
    
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    convertAll() {
        for (const [currency, rate] of Object.entries(this.rates)) {
            const convertedAmount = this.currentAmount * rate;
            const amountElement = document.getElementById(`${currency.toLowerCase()}Amount`);
            const rateElement = document.getElementById(`${currency.toLowerCase()}Rate`);
            
            if (amountElement) {
                amountElement.textContent = this.formatNumber(convertedAmount.toFixed(2));
            }
            
            if (rateElement) {
                rateElement.textContent = rate.toFixed(4);
            }
        }
    }
    
    reverseConversion(currency) {
        // Show reverse conversion rate
        const reverseRate = 1 / this.rates[currency];
        alert(`1 ${currency} = ${reverseRate.toFixed(4)} NPR\n\nClick the refresh button to get latest rates.`);
    }
    
    async fetchLatestRates() {
        this.showLoading();
        
        try {
            // Try multiple API sources
            const apiSources = [
                'https://api.frankfurter.app/latest?from=NPR',
                'https://api.exchangerate-api.com/v4/latest/NPR'
            ];
            
            for (const apiUrl of apiSources) {
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    
                    if (data.rates) {
                        // Update rates for our supported currencies
                        const newRates = {
                            USD: data.rates.USD || this.rates.USD,
                            INR: data.rates.INR || this.rates.INR,
                            EUR: data.rates.EUR || this.rates.EUR,
                            GBP: data.rates.GBP || this.rates.GBP,
                            AUD: data.rates.AUD || this.rates.AUD,
                            JPY: data.rates.JPY || this.rates.JPY
                        };
                        
                        this.rates = newRates;
                        this.lastUpdated = new Date();
                        this.saveToCache();
                        this.updateDisplay();
                        this.updateTimeDisplay();
                        this.populateRatesTable();
                        this.showNotification('Rates updated successfully!');
                        
                        break; // Stop after first successful API
                    }
                } catch (error) {
                    console.warn(`API failed: ${apiUrl}`, error);
                    continue;
                }
            }
        } catch (error) {
            console.error('All APIs failed:', error);
            this.showNotification('Failed to update rates. Using cached data.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    updateDisplay() {
        this.convertAll();
    }
    
    updateTimeDisplay() {
        const timeElement = document.getElementById('updateTime');
        if (timeElement) {
            timeElement.textContent = this.lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    startAutoUpdate() {
        setInterval(() => {
            if (this.autoUpdate) {
                this.fetchLatestRates();
            }
        }, this.updateInterval);
    }
    
    toggleAutoUpdate() {
        this.autoUpdate = !this.autoUpdate;
        const button = document.getElementById('autoUpdateBtn');
        if (this.autoUpdate) {
            button.innerHTML = '<i class="fas fa-sync"></i> Auto Update (ON)';
            button.style.background = 'var(--success)';
            this.showNotification('Auto update enabled');
        } else {
            button.innerHTML = '<i class="fas fa-sync"></i> Auto Update (OFF)';
            button.style.background = 'var(--warning)';
            this.showNotification('Auto update disabled');
        }
    }
    
    populateRatesTable() {
        const tableBody = document.getElementById('ratesTableBody');
        tableBody.innerHTML = '';
        
        const currencies = [
            { name: 'US Dollar', code: 'USD', flag: '🇺🇸' },
            { name: 'Indian Rupee', code: 'INR', flag: '🇮🇳' },
            { name: 'Euro', code: 'EUR', flag: '🇪🇺' },
            { name: 'British Pound', code: 'GBP', flag: '🇬🇧' },
            { name: 'Australian Dollar', code: 'AUD', flag: '🇦🇺' },
            { name: 'Japanese Yen', code: 'JPY', flag: '🇯🇵' }
        ];
        
        currencies.forEach(currency => {
            const rate = this.rates[currency.code];
            const buyRate = rate * 0.99; // Simulated buy rate (1% lower)
            const sellRate = rate * 1.01; // Simulated sell rate (1% higher)
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${currency.flag} ${currency.name}</td>
                <td><strong>${currency.code}</strong></td>
                <td>${buyRate.toFixed(4)}</td>
                <td>${sellRate.toFixed(4)}</td>
                <td>${this.lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    saveToCache() {
        const cacheData = {
            rates: this.rates,
            lastUpdated: this.lastUpdated.getTime()
        };
        localStorage.setItem('nprExchangeRates', JSON.stringify(cacheData));
    }
    
    loadFromCache() {
        const cached = localStorage.getItem('nprExchangeRates');
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                const cacheAge = Date.now() - cacheData.lastUpdated;
                
                if (cacheAge < 3600000) { // 1 hour cache
                    this.rates = cacheData.rates;
                    this.lastUpdated = new Date(cacheData.lastUpdated);
                }
            } catch (error) {
                console.error('Error loading cache:', error);
            }
        }
    }
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles if not present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 15px 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                    min-width: 300px;
                }
                
                .notification.success {
                    border-left: 4px solid var(--success);
                }
                
                .notification.error {
                    border-left: 4px solid #e53e3e;
                }
                
                .notification i {
                    font-size: 1.2rem;
                }
                
                .notification.success i {
                    color: var(--success);
                }
                
                .notification.error i {
                    color: #e53e3e;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update active nav link
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.exchange = new NPRExchange();
});