document.addEventListener('DOMContentLoaded', function() {
    // Announcement Bar
    const announcementBar = document.getElementById('announcementBar');
    const closeAnnouncement = document.getElementById('closeAnnouncement');
    
    if (closeAnnouncement && announcementBar) {
        // Check if the user has previously closed the announcement
        if (localStorage.getItem('announcementClosed') === 'true') {
            announcementBar.style.display = 'none';
        }
        
        closeAnnouncement.addEventListener('click', function() {
            announcementBar.style.display = 'none';
            localStorage.setItem('announcementClosed', 'true');
        });
    }
    
    // Waitlist Form
    const waitlistForm = document.getElementById('waitlistForm');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const companyEmail = document.getElementById('companyEmail').value;
            const companyName = document.getElementById('companyName').value;
            const companySize = document.getElementById('companySize').value;
            const consent = document.getElementById('consent').checked;
            
            if (!fullName || !companyEmail || !companyName || !companySize || !consent) {
                showFormMessage(waitlistForm, 'Please fill out all required fields.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(companyEmail)) {
                showFormMessage(waitlistForm, 'Please enter a valid email address.', 'error');
                return;
            }
            
            // In a real implementation, you would send this data to a server
            // For now, we'll just simulate a successful submission
            console.log('Form submitted:', { fullName, companyEmail, companyName, companySize });
            
            // Show success message
            showFormMessage(waitlistForm, 'Thank you for joining our waitlist! We\'ll be in touch soon.', 'success');
            
            // Reset form
            waitlistForm.reset();
        });
    }
    
    // Countdown Timer
    initCountdown();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for header height
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Sticky CTA visibility based on scroll position
    const stickyCta = document.getElementById('stickyCta');
    if (stickyCta) {
        window.addEventListener('scroll', function() {
            // Show sticky CTA after scrolling past the hero section
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
                
                if (window.pageYOffset > heroBottom) {
                    stickyCta.classList.add('visible');
                } else {
                    stickyCta.classList.remove('visible');
                }
            }
        });
    }
    
    // Feature card animations on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const featureObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    featureObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        featureCards.forEach(card => {
            featureObserver.observe(card);
        });
    }
});

// Helper function to show form messages
function showFormMessage(form, message, type) {
    // Remove any existing message
    const existingMessage = form.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.className = `form-message ${type}`;
    messageElement.textContent = message;
    
    // Insert after form
    form.parentNode.insertBefore(messageElement, form.nextSibling);
    
    // Auto-remove after 5 seconds if it's a success message
    if (type === 'success') {
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => messageElement.remove(), 500);
        }, 5000);
    }
}

// Initialize countdown timer
function initCountdown() {
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;
    
    // Set the launch date (30 days from now)
    const now = new Date();
    const launchDate = new Date(now);
    launchDate.setDate(now.getDate() + 30);
    
    function updateCountdown() {
        const currentTime = new Date();
        const difference = launchDate - currentTime;
        
        if (difference <= 0) {
            // Countdown has ended
            daysElement.textContent = '0';
            hoursElement.textContent = '0';
            minutesElement.textContent = '0';
            secondsElement.textContent = '0';
            return;
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        daysElement.textContent = days;
        hoursElement.textContent = hours < 10 ? '0' + hours : hours;
        minutesElement.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsElement.textContent = seconds < 10 ? '0' + seconds : seconds;
    }
    
    // Update the countdown every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}
