// Restaurant data
let restaurantData = { restaurants: [] };
let allRestaurants = [];

// Load restaurant data from JSON file
fetch('restaurant_data.json')
  .then(response => response.json())
  .then(data => {
    restaurantData = data;
    allRestaurants = restaurantData.restaurants;
    populateCategoryFilter();
    renderTopRestaurants();
    updateRestaurantList();
  })
  .catch(error => {
    console.error('Error loading restaurant data:', error);
  });

// Global variables
let currentFilters = {
  category: '',
  city: '',
  status: '',
  awards: '',
  search: ''
};

let currentSort = 'rank';

// Initialize the dashboard
function initDashboard() {
  console.log('Initializing dashboard...');
  
  try {
    // Get DOM elements
    const categoryFilter = document.getElementById('categoryFilter');
    const cityFilter = document.getElementById('cityFilter');
    const statusFilter = document.getElementById('statusFilter');
    const awardsFilter = document.getElementById('awardsFilter');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const restaurantCards = document.getElementById('restaurantCards');
    const topRestaurants = document.getElementById('topRestaurants');
    const resultsCount = document.getElementById('resultsCount');
    const awardWinners = document.getElementById('awardWinners');
    const closedRestaurants = document.getElementById('closedRestaurants');
    const restaurantModal = document.getElementById('restaurantModal');
    const closeModal = document.querySelector('.close-modal');

    // Check if all elements exist
    if (!categoryFilter || !restaurantCards || !topRestaurants) {
      console.error('Required DOM elements not found');
      return;
    }
    
    // Populate category filter
    populateCategoryFilter();
    
    // Render all sections
    renderRestaurants();
    renderTopRestaurants();
    renderAwardWinners();
    renderClosedRestaurants();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Dashboard initialized successfully');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
}

// Populate category filter dropdown
function populateCategoryFilter() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
  
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  
  const categories = new Set();
  allRestaurants.forEach(restaurant => {
    if (restaurant.category) {
      categories.add(restaurant.category);
    }
  });
  
  Array.from(categories).sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Filter and sort restaurants
function getFilteredRestaurants() {
  let filtered = allRestaurants.filter(restaurant => {
    // Category filter
    if (currentFilters.category && restaurant.category !== currentFilters.category) {
      return false;
    }
    
    // City filter
    if (currentFilters.city && restaurant.city !== currentFilters.city) {
      return false;
    }
    
    // Status filter
    if (currentFilters.status && restaurant.status !== currentFilters.status) {
      return false;
    }
    
    // Awards filter
    if (currentFilters.awards) {
      if (currentFilters.awards === 'michelin' && !restaurant.michelin) {
        return false;
      }
      if (currentFilters.awards === 'james_beard' && !restaurant.james_beard) {
        return false;
      }
    }
    
    // Search filter
    if (currentFilters.search) {
      const search = currentFilters.search.toLowerCase();
      const searchableText = [
        restaurant.name,
        restaurant.category,
        restaurant.city,
        restaurant.location || '',
        restaurant.notes || ''
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(search)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (currentSort) {
      case 'rank':
        // Handle restaurants without rank (closed ones)
        if (a.rank === 0 && b.rank === 0) return 0;
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'city':
        return a.city.localeCompare(b.city);
      default:
        return 0;
    }
  });
  
  return filtered;
}

// Render restaurant cards
function renderRestaurants() {
  const restaurantCards = document.getElementById('restaurantCards');
  const resultsCount = document.getElementById('resultsCount');
  
  if (!restaurantCards || !resultsCount) return;
  
  const filteredRestaurants = getFilteredRestaurants();
  
  // Update results count
  resultsCount.textContent = `${filteredRestaurants.length} results`;
  
  // Clear previous cards
  restaurantCards.innerHTML = '';
  
  if (filteredRestaurants.length === 0) {
    restaurantCards.innerHTML = '<p>No restaurants found matching your criteria.</p>';
    return;
  }
  
  // Render restaurant cards
  filteredRestaurants.forEach(restaurant => {
    const card = createRestaurantCard(restaurant);
    restaurantCards.appendChild(card);
  });
}

// Create a restaurant card element
function createRestaurantCard(restaurant) {
  const card = document.createElement('div');
  card.className = 'restaurant-card';
  card.dataset.name = restaurant.name;
  
  // Create star rating display
  const starsHtml = createStarRating(restaurant.rating);
  
  // Create badges
  let badgesHtml = '';
  if (restaurant.michelin && restaurant.michelin !== false) {
    badgesHtml += `<span class="badge michelin">🌟 Michelin</span>`;
  }
  if (restaurant.james_beard && restaurant.james_beard !== false) {
    badgesHtml += `<span class="badge james-beard">🏆 James Beard</span>`;
  }
  if (restaurant.status === 'CLOSED') {
    badgesHtml += `<span class="badge closed">⚠️ Closed</span>`;
  }
  
  // Status dot color
  const statusDotClass = restaurant.status === 'Open' ? 'open' : 'closed';
  const statusText = restaurant.status === 'Open' ? 'Open' : 'Closed';
  
  // Handle rank display (some closed restaurants might have rank 0)
  const rankDisplay = restaurant.rank > 0 ? `#${restaurant.rank}` : '';
  
  card.innerHTML = `
    <div class="restaurant-card-header">
      <h3 class="restaurant-name">${restaurant.name}</h3>
      <div class="status-indicator">
        <span class="status-dot ${statusDotClass}"></span>
        <span>${statusText}</span>
      </div>
    </div>
    <div class="restaurant-meta">
      <div class="category-rank">${rankDisplay} ${restaurant.category}</div>
      <div class="rating-display">
        <div class="stars">${starsHtml}</div>
        <div class="rating-number">${restaurant.rating.toFixed(1)}</div>
      </div>
    </div>
    <div class="location-info">
      <strong>${restaurant.city}</strong> • ${restaurant.location}
    </div>
    <div class="hours-info">
      ${restaurant.hours}
    </div>
    <div class="badges">
      ${badgesHtml}
    </div>
  `;
  
  // Add click event for opening modal
  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(restaurant);
  });
  
  return card;
}

// Create star rating HTML
function createStarRating(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="star">★</span>';
  }
  
  // Add half star if needed
  if (halfStar) {
    stars += '<span class="star">★</span>';
  }
  
  // Add empty stars
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<span class="star empty">☆</span>';
  }
  
  return stars;
}

// Render top restaurants by category
function renderTopRestaurants() {
  const topRestaurants = document.getElementById('topRestaurants');
  if (!topRestaurants) return;
  
  topRestaurants.innerHTML = '';
  
  // Get top restaurant in each category
  const topByCategory = {};
  allRestaurants.forEach(restaurant => {
    if (restaurant.status === 'Open' && restaurant.rank === 1) {
      topByCategory[restaurant.category] = restaurant;
    }
  });
  
  // Create cards for top restaurants
  Object.values(topByCategory).slice(0, 6).forEach(restaurant => {
    const card = document.createElement('div');
    card.className = 'top-restaurant-card';
    card.innerHTML = `
      <span class="category-badge">${restaurant.category}</span>
      <h4>${restaurant.name}</h4>
      <div class="rating-display">
        <div class="stars">${createStarRating(restaurant.rating)}</div>
        <div class="rating-number">${restaurant.rating.toFixed(1)}</div>
      </div>
    `;
    
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(restaurant);
    });
    topRestaurants.appendChild(card);
  });
}

// Render award winners section
function renderAwardWinners() {
  const awardWinners = document.getElementById('awardWinners');
  if (!awardWinners) return;
  
  awardWinners.innerHTML = '';
  
  // Get Michelin and James Beard winners
  const winners = allRestaurants.filter(restaurant => 
    (restaurant.michelin && restaurant.michelin !== false) || 
    (restaurant.james_beard && restaurant.james_beard !== false)
  );
  
  winners.forEach(restaurant => {
    const winner = document.createElement('div');
    winner.className = 'award-winner';
    
    let awardText = '';
    if (restaurant.michelin && restaurant.michelin !== false) {
      awardText += '🌟 Michelin';
      if (typeof restaurant.michelin === 'string') {
        awardText += ` (${restaurant.michelin})`;
      }
    }
    
    if (restaurant.james_beard && restaurant.james_beard !== false) {
      if (awardText) awardText += ' • ';
      awardText += '🏆 James Beard';
      if (typeof restaurant.james_beard === 'string') {
        awardText += ` (${restaurant.james_beard})`;
      }
    }
    
    winner.innerHTML = `
      <div class="award-winner-name">${restaurant.name}</div>
      <div class="award-winner-info">${awardText} • ${restaurant.category}</div>
    `;
    
    winner.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(restaurant);
    });
    awardWinners.appendChild(winner);
  });
}

// Render closed restaurants section
function renderClosedRestaurants() {
  const closedRestaurants = document.getElementById('closedRestaurants');
  if (!closedRestaurants) return;
  
  closedRestaurants.innerHTML = '';
  
  const closed = allRestaurants.filter(restaurant => 
    restaurant.status === 'CLOSED'
  );
  
  closed.forEach(restaurant => {
    const closedItem = document.createElement('div');
    closedItem.className = 'closed-restaurant';
    
    closedItem.innerHTML = `
      <div class="closed-restaurant-name">${restaurant.name}</div>
      <div class="closed-restaurant-info">${restaurant.category} • ${restaurant.hours}</div>
    `;
    
    closedItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(restaurant);
    });
    closedRestaurants.appendChild(closedItem);
  });
}

// Open restaurant detail modal
function openModal(restaurant) {
  const restaurantModal = document.getElementById('restaurantModal');
  const modalContent = document.getElementById('modalContent');
  
  if (!restaurantModal || !modalContent) return;
  
  // Create star rating display
  const starsHtml = createStarRating(restaurant.rating);
  
  // Create badges
  let badgesHtml = '';
  if (restaurant.michelin && restaurant.michelin !== false) {
    badgesHtml += `<span class="badge michelin">🌟 Michelin</span>`;
  }
  if (restaurant.james_beard && restaurant.james_beard !== false) {
    badgesHtml += `<span class="badge james-beard">🏆 James Beard</span>`;
  }
  if (restaurant.status === 'CLOSED') {
    badgesHtml += `<span class="badge closed">⚠️ Closed</span>`;
  }
  
  // Handle rank display
  const rankDisplay = restaurant.rank > 0 ? `#${restaurant.rank}` : 'Unranked';
  
  modalContent.innerHTML = `
    <h2 class="modal-restaurant-name">${restaurant.name}</h2>
    
    <div class="modal-section">
      <div class="restaurant-meta">
        <div class="category-rank">${rankDisplay} ${restaurant.category}</div>
        <div class="rating-display">
          <div class="stars">${starsHtml}</div>
          <div class="rating-number">${restaurant.rating.toFixed(1)}</div>
        </div>
      </div>
    </div>
    
    <div class="modal-section">
      <h4>Location</h4>
      <p>${restaurant.city} • ${restaurant.location}</p>
    </div>
    
    <div class="modal-section">
      <h4>Hours</h4>
      <p>${restaurant.hours}</p>
    </div>
    
    <div class="modal-section">
      <h4>Status</h4>
      <p>${restaurant.status}</p>
    </div>
    
    ${badgesHtml ? `<div class="modal-section">
      <h4>Awards & Recognition</h4>
      <div class="badges">
        ${badgesHtml}
      </div>
    </div>` : ''}
    
    <div class="modal-section">
      <h4>Notes</h4>
      <p>${restaurant.notes}</p>
    </div>
  `;
  
  restaurantModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close modal
function closeModalFunc() {
  const restaurantModal = document.getElementById('restaurantModal');
  if (restaurantModal) {
    restaurantModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Set up event listeners
function setupEventListeners() {
  // Filter change events
  const categoryFilter = document.getElementById('categoryFilter');
  const cityFilter = document.getElementById('cityFilter');
  const statusFilter = document.getElementById('statusFilter');
  const awardsFilter = document.getElementById('awardsFilter');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const closeModal = document.querySelector('.close-modal');
  const restaurantModal = document.getElementById('restaurantModal');
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      renderRestaurants();
    });
  }
  
  if (cityFilter) {
    cityFilter.addEventListener('change', (e) => {
      currentFilters.city = e.target.value;
      renderRestaurants();
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      renderRestaurants();
    });
  }
  
  if (awardsFilter) {
    awardsFilter.addEventListener('change', (e) => {
      currentFilters.awards = e.target.value;
      renderRestaurants();
    });
  }
  
  // Search input with debounce
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value;
        renderRestaurants();
      }, 300);
    });
  }
  
  // Sort change
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderRestaurants();
    });
  }
  
  // Modal close button
  if (closeModal) {
    closeModal.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModalFunc();
    });
  }
  
  // Close modal when clicking outside of content
  if (restaurantModal) {
    restaurantModal.addEventListener('click', (e) => {
      if (e.target === restaurantModal) {
        closeModalFunc();
      }
    });
  }
  
  // Close modal with escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModalFunc();
    }
  });
}

// Initialize the dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing dashboard...');
  initDashboard();
});

// Fallback initialization
window.addEventListener('load', () => {
  if (!document.getElementById('restaurantCards').innerHTML) {
    console.log('Fallback initialization...');
    initDashboard();
  }
});