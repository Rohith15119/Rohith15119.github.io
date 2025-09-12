
document.addEventListener('DOMContentLoaded', function(){
  // Helper functions
  function $(sel){return document.querySelector(sel);}
  function $all(sel){return Array.from(document.querySelectorAll(sel));}

  // Load state
  var cart = JSON.parse(localStorage.getItem('cart') || '[]'); // array of {title,price,img}
  var cartBadge = $('#cart-badge');
  if (cartBadge) cartBadge.textContent = cart.length;

  // Add to cart handlers
  $all('.add-to-cart').forEach(function(btn){
    btn.addEventListener('click', function(){
      var title = btn.getAttribute('data-course');
      var price = Number(btn.getAttribute('data-price')) || 0;
      var img = btn.getAttribute('data-img') || '';
      if (!title) return;
      // prevent duplicates
      if (cart.findIndex(function(c){return c.title===title}) !== -1){ alert(title + ' is already in cart'); return; }
      cart.push({title:title,price:price,img:img});
      localStorage.setItem('cart', JSON.stringify(cart));
      if (cartBadge) cartBadge.textContent = cart.length;
      renderStickyTotal();
      alert(title + ' added to cart');
    });
  });

  // Enroll handlers
  $all('.enroll-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var title = btn.getAttribute('data-course');
      var price = Number(btn.getAttribute('data-price')) || 0;
      var img = btn.getAttribute('data-img') || '';
      var user = localStorage.getItem('loggedInUser');
      if (!user){ window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname); return; }
      // simulate checkout single-item
      localStorage.setItem('enrolled', JSON.stringify([{title:title,price:price,img:img}]));
      window.location.href = 'success.html';
    });
  });

  // Details modal
  var modal = $('#modal');
  function openModal(data){
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    modal.querySelector('#modal-title').textContent = data.title || '';
    modal.querySelector('#modal-desc').textContent = data.desc || '';
    modal.querySelector('#modal-meta').textContent = (data.duration || '') + ' • ' + (data.rating || '');
    document.body.style.overflow='hidden';
  }
  function closeModal(){ if(!modal) return; modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  document.addEventListener('click', function(e){
    var d = e.target.closest('.details-btn');
    if (d){
      var card = d.closest('[data-course]');
      if (card && card.getAttribute('data-course')){
        try{ var data = JSON.parse(card.getAttribute('data-course')); openModal(data); } catch(err){ console.error(err); }
      }
    }
    if (e.target.closest('.modal-close') || e.target.classList.contains('modal')) closeModal();
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  // Cart modal rendering
  var cartModal = $('#cartModal');
  var cartItemsEl = $('#cartItems');
  function renderCart(){
    if (!cartItemsEl) return;
    if (!cart || cart.length===0){ cartItemsEl.innerHTML = '<p>Your cart is empty.</p>'; return; }
    cartItemsEl.innerHTML = '';
    cart.forEach(function(item, idx){
      var div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = '<img src="'+item.img+'" alt=""><div style="flex:1"><div style="font-weight:700">'+item.title+'</div><div style="color:var(--muted)">$'+item.price.toFixed(2)+'</div></div><div><button class="btn outline remove-btn" data-idx="'+idx+'">Remove</button></div>';
      cartItemsEl.appendChild(div);
    });
    // attach remove handlers
    cartItemsEl.querySelectorAll('.remove-btn').forEach(function(b){
      b.addEventListener('click', function(){
        var i = Number(b.getAttribute('data-idx'));
        if (!isNaN(i)){ cart.splice(i,1); localStorage.setItem('cart', JSON.stringify(cart)); if (cartBadge) cartBadge.textContent = cart.length; renderCart(); renderStickyTotal(); }
      });
    });
    // summary
    var subtotal = cart.reduce(function(s,it){return s + Number(it.price);},0);
    var sumDiv = document.createElement('div');
    sumDiv.className='cart-summary';
    sumDiv.innerHTML = '<div>Subtotal</div><div>$'+subtotal.toFixed(2)+'</div>';
    cartItemsEl.appendChild(sumDiv);
  }

  // Cart toggle
  var cartToggle = $('#cartToggle');
  if (cartToggle) cartToggle.addEventListener('click', function(){ if(!cartModal) return; cartModal.setAttribute('aria-hidden','false'); renderCart(); });
  if (cartModal) cartModal.addEventListener('click', function(e){ if (e.target === cartModal || e.target.closest('.modal-close')) cartModal.setAttribute('aria-hidden','true'); });

  // Checkout button inside cart modal
  var checkoutBtn = $('#checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', function(){
    var user = localStorage.getItem('loggedInUser');
    if (!user){ window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname); return; }
    if (!cart || cart.length===0){ alert('Cart is empty'); return; }
    // simulate enrollment for all items, save enrolled and totalPaid
    localStorage.setItem('enrolled', JSON.stringify(cart));
    var total = cart.reduce(function(s,it){return s + Number(it.price);},0);
    localStorage.setItem('lastPayment', JSON.stringify({total: total}));
    cart = []; localStorage.setItem('cart', JSON.stringify(cart)); if (cartBadge) cartBadge.textContent = 0;
    renderCart(); renderStickyTotal();
    window.location.href = 'success.html';
  });

  // Sticky total bar on courses page
  function renderStickyTotal(){
    var bar = $('#stickyTotal');
    if (!bar) return;
    var totalEl = bar.querySelector('.total-amount');
    var countEl = bar.querySelector('.item-count');
    if (!cart || cart.length===0){ bar.style.display='none'; return; }
    var total = cart.reduce(function(s,it){return s + Number(it.price);},0);
    countEl.textContent = cart.length + (cart.length===1 ? ' item' : ' items');
    totalEl.textContent = '$' + total.toFixed(2);
    bar.style.display = 'flex';
  }
  renderStickyTotal();

  // Courses page total "Go to cart"
  var gotoCart = $('#gotoCartBtn');
  if (gotoCart) gotoCart.addEventListener('click', function(){ if (cartModal) { cartModal.setAttribute('aria-hidden','false'); renderCart(); } });

  // Login handling (simple localStorage user)
  var loginForm = $('#loginForm');
  if (loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      var username = (document.getElementById('username')||{}).value || '';
      var password = (document.getElementById('password')||{}).value || '';
      if (!username || !password){ alert('Enter username and password'); return; }
      var users = JSON.parse(localStorage.getItem('users') || '{}');
      if (!users[username]){ users[username] = password; localStorage.setItem('users', JSON.stringify(users)); alert('Account created & logged in'); }
      else if (users[username] !== password){ alert('Incorrect password'); return; }
      localStorage.setItem('loggedInUser', username);
      var params = new URLSearchParams(window.location.search);
      var next = params.get('next') || 'index.html';
      window.location.href = next;
    });
  }

  // Refresh user display
  (function refreshUser(){
    var user = localStorage.getItem('loggedInUser');
    var loginLink = $('#loginLink');
    if (!loginLink) return;
    if (user){ loginLink.innerHTML = '<i class="fas fa-user-circle"></i> ' + user; loginLink.href='#'; if (!$('#logoutLink')){ var out = document.createElement('a'); out.id='logoutLink'; out.href='#'; out.className='user-link'; out.style.marginLeft='8px'; out.textContent='Logout'; out.addEventListener('click', function(ev){ ev.preventDefault(); localStorage.removeItem('loggedInUser'); refreshUser(); }); loginLink.after(out); } }
    else { loginLink.textContent = 'Login'; loginLink.href = 'login.html'; var lo = $('#logoutLink'); if (lo) lo.remove(); }
  })();

  // Contact & feedback toasts
  var contactForm = $('#contactForm');
  if (contactForm) contactForm.addEventListener('submit', function(e){ e.preventDefault(); var toast = $('#contactToast'); if (toast){ toast.hidden=false; toast.textContent='Thanks — your message has been received.'; contactForm.reset(); setTimeout(function(){ toast.hidden=true; },3500); } });
  var feedbackForm = $('#feedbackForm');
  if (feedbackForm) feedbackForm.addEventListener('submit', function(e){ e.preventDefault(); var toast = $('#feedbackToast'); if (toast){ toast.hidden=false; toast.textContent='Thanks for the feedback!'; feedbackForm.reset(); setTimeout(function(){ toast.hidden=true; },3500); } });

  // Success page show details
  if (window.location.pathname.endsWith('success.html')){
    var enrolled = JSON.parse(localStorage.getItem('enrolled') || '[]');
    var lastPayment = JSON.parse(localStorage.getItem('lastPayment') || 'null');
    var el = $('#success-msg');
    if (el){
      if (enrolled && enrolled.length>0){
        var list = enrolled.map(function(it){ return it.title + ' ($'+Number(it.price).toFixed(2)+')'; }).join(', ');
        var paid = lastPayment ? ('$'+Number(lastPayment.total).toFixed(2)) : (enrolled.reduce(function(s,it){return s+Number(it.price);},0)).toFixed(2);
        el.textContent = 'You have enrolled in: ' + list + '. Total Paid: ' + paid;
      }
    }
  }

  // Scroll-top button
  var st = $('#scroll-top');
  window.addEventListener('scroll', function(){ if (!st) return; st.style.display = window.scrollY > 300 ? 'flex' : 'none'; });
  if (st) st.addEventListener('click', function(){ window.scrollTo({top:0,behavior:'smooth'}); });

});