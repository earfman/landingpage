// Extra JavaScript for ZeroTrustKerberosLink documentation

document.addEventListener('DOMContentLoaded', function() {
  // Security feature highlighting
  highlightSecurityFeatures();
  
  // Add copy buttons to code blocks
  addCodeCopyButtons();
  
  // Initialize security level indicators
  initSecurityLevels();
  
  // Add interactive elements to architecture diagrams
  enhanceArchitectureDiagrams();
});

// Highlight security features throughout the documentation
function highlightSecurityFeatures() {
  const securityKeywords = [
    'input validation', 'xss protection', 'csrf', 'security header',
    'content security policy', 'secure communication', 'tls', 'encryption',
    'zero trust', 'authentication', 'authorization', 'audit log'
  ];
  
  // Find all paragraphs and list items
  const textElements = document.querySelectorAll('p, li');
  
  textElements.forEach(element => {
    const text = element.textContent.toLowerCase();
    
    // Check if the element contains any security keywords
    const hasSecurityKeyword = securityKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    if (hasSecurityKeyword && !element.closest('.security-feature') && 
        !element.closest('.security-card') && !element.closest('.zero-trust-principle')) {
      // Wrap the element in a security feature highlight
      const wrapper = document.createElement('div');
      wrapper.className = 'security-feature';
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }
  });
}

// Add copy buttons to code blocks
function addCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre > code');
  
  codeBlocks.forEach(codeBlock => {
    const pre = codeBlock.parentNode;
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    
    // Add click event
    copyButton.addEventListener('click', () => {
      const code = codeBlock.textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      });
    });
    
    // Add button to pre element
    pre.appendChild(copyButton);
  });
}

// Initialize security level indicators
function initSecurityLevels() {
  const securityLevels = document.querySelectorAll('.security-level');
  
  securityLevels.forEach(level => {
    // Add appropriate class based on content
    const text = level.textContent.toLowerCase();
    if (text.includes('high')) {
      level.classList.add('high');
    } else if (text.includes('medium')) {
      level.classList.add('medium');
    } else if (text.includes('low')) {
      level.classList.add('low');
    }
  });
}

// Enhance architecture diagrams with interactive elements
function enhanceArchitectureDiagrams() {
  const diagrams = document.querySelectorAll('.architecture-diagram');
  
  diagrams.forEach(diagram => {
    // Find all components in the diagram
    const components = diagram.querySelectorAll('code');
    
    components.forEach(component => {
      // Make components interactive
      component.style.cursor = 'pointer';
      
      // Add click event to show more information
      component.addEventListener('click', () => {
        // Check if there's already a description
        let description = component.nextElementSibling;
        if (description && description.classList.contains('component-description')) {
          // Toggle visibility
          description.style.display = description.style.display === 'none' ? 'block' : 'none';
        } else {
          // Create a new description
          description = document.createElement('div');
          description.className = 'component-description';
          description.style.display = 'block';
          
          // Set description content based on component name
          const componentName = component.textContent.toLowerCase();
          if (componentName.includes('kerberos')) {
            description.textContent = 'Kerberos authentication component that handles ticket validation and principal extraction.';
          } else if (componentName.includes('aws')) {
            description.textContent = 'AWS integration component that handles role assumption and temporary credential generation.';
          } else if (componentName.includes('redis')) {
            description.textContent = 'Secure Redis cache for storing session information with TLS encryption.';
          } else if (componentName.includes('zero') || componentName.includes('trust')) {
            description.textContent = 'Core Zero Trust component that evaluates context and enforces security policies.';
          } else {
            description.textContent = 'Component of the ZeroTrustKerberosLink architecture.';
          }
          
          // Insert after the component
          component.parentNode.insertBefore(description, component.nextSibling);
        }
      });
    });
  });
}

// Add security checklist functionality
function initSecurityChecklists() {
  const checklistItems = document.querySelectorAll('.security-checklist input[type="checkbox"]');
  
  checklistItems.forEach(item => {
    // Store checkbox state in localStorage
    const id = item.id || Math.random().toString(36).substring(2);
    if (!item.id) item.id = id;
    
    // Check if state is saved
    const checked = localStorage.getItem(`checklist-${id}`) === 'true';
    item.checked = checked;
    
    // Add change event
    item.addEventListener('change', () => {
      localStorage.setItem(`checklist-${id}`, item.checked);
    });
  });
}

// Initialize when the document is fully loaded
if (document.readyState === 'complete') {
  initSecurityChecklists();
} else {
  document.addEventListener('DOMContentLoaded', initSecurityChecklists);
}
