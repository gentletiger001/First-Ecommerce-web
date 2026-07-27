// Shared product data and rendering logic for the storefront.
// This keeps the Home page and All Products page using the same source of truth.

const products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'High-quality sound with noise cancellation.',
    price: 12000,
    originalPrice: 15000,
    discount: '20% OFF',
    rating: '★★★★★',
    image: './img/imgi_82_Rockerz_551_ANC_Pro.347_1.jpg',
    category: 'electronics',
    alt: 'Wireless Headphones'
  },
  {
    id: 2,
    name: 'Smartphone Case',
    description: 'Durable protection for your device.',
    price: 2550,
    originalPrice: 3000,
    discount: '15% OFF',
    rating: '★★★★☆',
    image: './img/imgi_68_BEST-IPHONE-16-CASES-2048px-4833-2x1-1.jpg',
    category: 'electronics',
    alt: 'Smartphone Case'
  },
  {
    id: 3,
    name: 'Laptop Stand',
    description: 'Ergonomic design for better posture.',
    price: 7000,
    originalPrice: 10000,
    discount: '30% OFF',
    rating: '★★★★★',
    image: './img/imgi_83_k-lYSkUcwk-3yX8av8w8Rg.c-r.jpg',
    category: 'electronics',
    alt: 'Laptop Stand'
  },
  {
    id: 4,
    name: 'USB-C Cable',
    description: 'Fast charging and data transfer.',
    price: 2250,
    originalPrice: 2500,
    discount: '10% OFF',
    rating: '★★★★☆',
    image: './img/imgi_264_original-ACCG8RZFUFCZSPBG_1.PNG',
    category: 'electronics',
    alt: 'USB-C Cable'
  },
  {
    id: 5,
    name: 'Portable Speaker',
    description: 'Waterproof with powerful bass.',
    price: 8000,
    originalPrice: 10000,
    discount: '',
    rating: '★★★★★',
    image: './img/imgi_283_reviews-top-portable-bluetooth-speakers-65e883a6d8581.jpg',
    category: 'electronics',
    alt: 'Portable Speaker'
  },
  {
    id: 6,
    name: 'Screen Protector',
    description: 'Tempered glass for maximum protection.',
    price: 3000,
    originalPrice: 4000,
    discount: '25% OFF',
    rating: '★★★☆☆',
    image: './img/imgi_183_Screen-protector.png',
    category: 'electronics',
    alt: 'Screen Protector'
  },
  {
    id: 7,
    name: 'Running Shoes',
    description: 'Lightweight and breathable.',
    price: 15000,
    originalPrice: 20000,
    discount: '25% OFF',
    rating: '★★★★☆',
    image: './img/imgi_95_mhl-opener-run-shoes-311-67edd9f20e75a.jpg',
    category: 'shoes',
    alt: 'Running Shoes'
  },
  {
    id: 8,
    name: 'Face Cream',
    description: 'Hydrating formula for all skin types.',
    price: 7600,
    originalPrice: 8000,
    discount: '5% OFF',
    rating: '★★★★★',
    image: './img/imgi_92_skincare-jar-cosmetic-anti-aging-260nw-2405853905.jpg',
    category: 'beauty',
    alt: 'Face Cream'
  }
];

function formatPrice(value) {
  return '₦' + Number(value).toLocaleString();
}

function getProductCards(items) {
  return items.map(function (product) {
    return '<article class="product-card">' +
      (product.discount ? '<div class="discount-badge">' + product.discount + '</div>' : '') +
      '<div class="wishlist">♥</div>' +
      '<img src="' + product.image + '" alt="' + product.alt + '">' +
      '<h3>' + product.name + '</h3>' +
      '<p>' + product.description + '</p>' +
      '<div class="price">' +
      (product.originalPrice ? '<span class="original">' + formatPrice(product.originalPrice) + '</span>' : '') +
      '<span class="discounted">' + formatPrice(product.price) + '</span>' +
      '</div>' +
      '<div class="rating">' + product.rating + '</div>' +
      '<button class="add-to-cart" data-product-id="' + product.id + '">Add to Cart</button>' +
      '</article>';
  }).join('');
}

function renderProducts(options) {
  var settings = options || {};
  var container = document.getElementById(settings.containerId || 'productGrid');
  var status = document.getElementById(settings.statusId || 'productStatus');
  var filterCategory = settings.category || 'all';
  var searchText = (settings.searchText !== undefined) ? settings.searchText : (document.getElementById('productSearch') ? document.getElementById('productSearch').value.trim().toLowerCase() : '');

  console.log('searchProducts fired with:', searchText); // Temporary debug log requested by the user.

  var visibleProducts = products.filter(function (product) {
    var matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    var matchesSearch = !searchText || product.name.toLowerCase().indexOf(searchText) !== -1 || product.description.toLowerCase().indexOf(searchText) !== -1 || product.category.toLowerCase().indexOf(searchText) !== -1;
    return matchesCategory && matchesSearch;
  });

  if (!container) {
    return;
  }

  if (!visibleProducts.length) {
    container.innerHTML = '';
    if (status) {
      status.textContent = 'No products found';
    }
    return;
  }

  container.innerHTML = getProductCards(visibleProducts);

  if (status) {
    status.textContent = '';
  }
}

function handleAddToCartButton(button) {
  if (!button) {
    return;
  }

  var productId = Number(button.getAttribute('data-product-id'));
  var selectedProduct = products.find(function (item) {
    return item.id === productId;
  });

  if (!selectedProduct) {
    return;
  }

  if (window.tigerAuth && window.tigerAuth.addToCart) {
    window.tigerAuth.addToCart({
      name: selectedProduct.name,
      price: selectedProduct.price,
      image: selectedProduct.image,
      quantity: 1
    });

    var originalText = button.textContent;
    button.textContent = 'Added!';
    setTimeout(function () {
      button.textContent = originalText;
    }, 900);
  }
}

function searchProducts() {
  var searchInput = document.getElementById('productSearch');
  var searchText = searchInput ? searchInput.value.trim().toLowerCase() : '';
  renderProducts({
    containerId: 'productGrid',
    statusId: 'productStatus',
    category: 'all',
    searchText: searchText
  });
}

function setupProductListing(options) {
  var settings = options || {};
  var containerId = settings.containerId || 'productGrid';
  var statusId = settings.statusId || 'productStatus';
  var category = settings.category || 'all';
  var searchInput = document.getElementById('productSearch');
  var searchButton = document.getElementById('searchButton');

  if (searchInput) {
    searchInput.addEventListener('input', searchProducts);
    searchInput.addEventListener('keyup', searchProducts);
  }

  if (searchButton) {
    searchButton.addEventListener('click', function (event) {
      event.preventDefault();
      searchProducts();
    });
  }

  renderProducts({
    containerId: containerId,
    statusId: statusId,
    category: category,
    searchText: ''
  });
}

document.addEventListener('click', function (event) {
  var clickedButton = event.target.closest('.add-to-cart');
  if (!clickedButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  handleAddToCartButton(clickedButton);
});

document.addEventListener('DOMContentLoaded', function () {
  var page = document.body.getAttribute('data-page') || 'home';
  if (page === 'products') {
    setupProductListing({ containerId: 'productGrid', statusId: 'productStatus', category: 'all' });
  } else if (page === 'electronics') {
    setupProductListing({ containerId: 'productGrid', statusId: 'productStatus', category: 'electronics' });
  } else {
    setupProductListing({ containerId: 'productGrid', statusId: 'productStatus', category: 'all' });
  }
});
