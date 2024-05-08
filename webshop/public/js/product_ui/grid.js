webshop.ProductGrid = class {
	/* Options:
		- items: Items
		- settings: Webshop Settings
		- products_section: Products Wrapper
		- preference: If preference is not grid view, render but hide
	*/
	constructor(options) {
		Object.assign(this, options);

		if (this.preference !== "Grid View") {
			this.products_section.addClass("hidden");
		}

		this.products_section.empty();
		frappe.call('webshop.webshop.api.get_customer').then((res) => {
			console.log("res-----------", res.message)
			window.customer_group = res.message
			this.make();
		});
	
	}

	make() {
		let me = this;
		let html = ``;

		this.items.forEach(item => {
			let title = item.web_item_name || item.item_name || item.item_code || "";
			title =  title.length > 90 ? title.substr(0, 90) + "..." : title;

			html += `<div class="col-sm-3 item-card"><div class="card text-left">`;
			html += me.get_image_html(item, title);
			html += me.get_card_body_html(item, title, me.settings);
			html += `</div></div>`;
		});

		let $product_wrapper = this.products_section;
		$product_wrapper.append(html);
	}

	get_image_html(item, title) {
		let image = item.website_image;

		if (image) {
			return `
				<div class="card-img-container">
					<a href="/${ item.route || '#' }" style="text-decoration: none;">
						<img class="card-img" src="${ image }" alt="${ title }">
					</a>
				</div>
			`;
		} else {
			return `
				<div class="card-img-container">
					<a href="/${ item.route || '#' }" style="text-decoration: none;">
						<img class="card-img" src="https://cdn-icons-png.flaticon.com/512/10446/10446694.png" alt="${ title }">
					</a>
				</div>
			`;
		}
	}

	get_card_body_html(item, title, settings) {
		let body_html = `
			<div class="card-body text-left card-body-flex" style="width:100%">
				<div style="margin-top: 1rem; display: flex;">
		`;
		body_html += this.get_title(item, title);

		// get floating elements
		if (!item.has_variants) {
			if (settings.enable_wishlist) {
				body_html += this.get_wishlist_icon(item);
			}
			if (settings.enabled) {
				body_html += this.get_cart_indicator(item);
			}

		}

		body_html += `</div>`;
		body_html += `<div class="product-category">${ item.item_group || '' }</div>`;

		if (item.formatted_price) {
			body_html += this.get_price_html(item);
		}

		body_html += this.get_stock_availability(item, settings);
		body_html += this.get_primary_button(item, settings);
		body_html += `</div>`; // close div on line 49

		return body_html;
	}

	get_title(item, title) {
		let title_html = `
			<a href="/${ item.route || '#' }">
				<div class="product-title">
					${ title || '' }
				</div>
			</a>
		`;
		return title_html;
	}

	get_wishlist_icon(item) {
		let icon_class = item.wished ? "wished" : "not-wished";
		return `
			<div class="like-action ${ item.wished ? "like-action-wished" : ''}"
				data-item-code="${ item.item_code }">
				<svg class="icon sm">
					<use class="${ icon_class } wish-icon" href="#icon-heart"></use>
				</svg>
			</div>
		`;
	}

	get_cart_indicator(item) {
		return `
			<div class="cart-indicator ${item.in_cart ? '' : 'hidden'}" data-item-code="${ item.item_code }">
				1
			</div>
		`;
	}

	get_price_html(item) {
		let price_html = `
			<div class="product-price">
				${ item.formatted_price || '' }
		`;

		if (item.formatted_mrp) {
			price_html += `
				<small class="striked-price">
					<s>${ item.formatted_mrp ? item.formatted_mrp.replace(/ +/g, "") : "" }</s>
				</small>
				<small class="ml-1 product-info-green">
					${ item.discount } OFF
				</small>
			`;
		}
		price_html += `</div>`;
		return price_html;
	}

	get_stock_availability(item, settings) {
		if (settings.show_stock_availability && !item.has_variants) {
			if (item.on_backorder) {
				return `
					<span class="out-of-stock mb-2 mt-1" style="color: var(--primary-color)">
						${ __("Available on backorder") }
					</span>
				`;
			} else if (!item.in_stock) {
				return `
					<span class="out-of-stock mb-2 mt-1">
						${ __("Out of stock") }
					</span>
				`;
			}
		}

		return ``;
	}
	get_primary_button(item, settings) {
		if (item.has_variants) {
			return `
				<a href="/${ item.route || '#' }">
					<div class="btn btn-sm btn-explore-variants btn mb-0 mt-0">
						${ __('Sizes and Prices') }
					</div>
				</a>
			`;
		} else if (settings.enabled && (settings.allow_items_not_in_stock || item.in_stock)) {
			let disabled = item.is_free_item ? 'disabled="disabled"' : '';

				if (frappe.session.user !== "Guest") {
					if(!item.in_stock && item.on_back_order === 0){
						item.stock_qty = 0
					} else if(!item.in_stock && item.on_back_order > 0){
						item.stock_qty = item.on_back_order
					}
					var basketQuantity = (window.customer_group === "B2C Customer") ? item.b2c_basket_qty : item.basket_qty;
								
					let cartQtySection = `
						<div class="d-flex order-3">
							<div class="input-group number-spinner mt-1">
								<div id="custom_basket_quantity" style="position: absolute; opacity: 0;">
									${basketQuantity}
								</div>
								<span class="input-group-prepend d-sm-inline-block qty-border">
									<button class="btn cart-btn cart-dec" data-dir="dwn">-</button>
								</span>
								<input class="form-control text-center cart-qty" value="${item.cart_qty}" data-item-code="${item.item_code}" basket-qty="${item.basket_qty}" stock-qty="${item.stock_qty}" style="max-width: 70px;" ${disabled}>
								<span class="input-group-append d-sm-inline-block qty-border1">
									<button class="btn cart-btn cart-inc" data-dir="up">+</button>
								</span>
								<button class="btn add-to-cart">
									<span class="">
										<svg class="icon icon-md" style="fill: white;">
											<use href="#icon-assets"></use>
										</svg>
									</span>
									Add to cart
								</button>
							</div>
						</div>
						<br>`;
					
						let basketQtyMessage = item.basket_qty > 1 ? `<p> ${ __("Sold in packs of {0}", [item.basket_qty]) }</p>` : '';
					
					return cartQtySection + basketQtyMessage;
				} else {
					return `
						<div id="${ item.name }" class="btn
							btn-sm btn-primary btn-add-to-cart-list mb-0
							${ item.in_cart ? 'hidden' : '' }"
							data-item-code="${ item.item_code }"
							style="margin-top: 0px !important; max-height: 30px; float: right;
								padding: 0.25rem 1rem; min-width: 135px;">
							<span class="mr-2">
								<svg class="icon icon-md">
									<use href="#icon-assets"></use>
								</svg>
							</span>
							${ settings.enable_checkout ? __('Add to Cart') :  __('Add to Quote') }
						</div>`;
				}
				} else {
					return ``;
				}
	}
};