( function ( $ ) {
	'use strict';

	var i18n = window.wp && window.wp.i18n;
	var translate = i18n ? i18n.__ : function ( text ) { return text; };

	function isCardToCardSelected() {
		return $( 'input[name="payment_method"]:checked' ).val() === window.WeblogbazCardToCardPayment.gatewayId;
	}

	function setUploadState( message, success ) {
		$( '.weblogbaz-card-to-card-payment-upload-status' ).text( message ).toggleClass( 'is-success', !! success );
	}

	function syncPlaceOrderButton() {
		var active = isCardToCardSelected();
		var valid = !! $( 'input[name="weblogbaz_receipt_token"]' ).val();
		$( '#place_order' ).prop( 'disabled', active && ! valid ).attr( 'aria-disabled', active && ! valid );
	}

	function uploadReceipt( input ) {
		var file = input.files && input.files[ 0 ];
		var form = new FormData();

		if ( ! file ) {
			return;
		}

		form.append( 'action', 'weblogbaz_card_to_card_prepare_receipt' );
		form.append( 'nonce', window.WeblogbazCardToCardPayment.nonce );
		form.append( 'weblogbaz_receipt', file );
		setUploadState( translate( 'Uploading...', 'weblogbaz-card-to-card-payment' ), false );
		$( input ).prop( 'disabled', true );

		fetch( window.WeblogbazCardToCardPayment.ajaxUrl, {
			method: 'POST',
			body: form,
			credentials: 'same-origin'
		} ).then( function ( response ) {
			return response.json();
		} ).then( function ( result ) {
			if ( ! result.success ) {
				throw new Error( result.data && result.data.message ? result.data.message : translate( 'The payment receipt upload failed.', 'weblogbaz-card-to-card-payment' ) );
			}
			$( 'input[name="weblogbaz_receipt_token"]' ).val( result.data.token );
			setUploadState( translate( 'Payment receipt uploaded successfully.', 'weblogbaz-card-to-card-payment' ), true );
		} ).catch( function ( error ) {
			$( 'input[name="weblogbaz_receipt_token"]' ).val( '' );
			setUploadState( error.message, false );
		} ).then( function () {
			$( input ).prop( 'disabled', false );
			syncPlaceOrderButton();
		} );
	}

	$( document ).on( 'change', '[data-weblogbaz-receipt-upload]', function () {
		uploadReceipt( this );
	} ).on( 'change', 'input[name="payment_method"]', syncPlaceOrderButton ).on( 'updated_checkout', syncPlaceOrderButton ).on( 'submit', 'form.checkout', function ( event ) {
		if ( isCardToCardSelected() && ! $( 'input[name="weblogbaz_receipt_token"]' ).val() ) {
			event.preventDefault();
			setUploadState( translate( 'A payment receipt upload is required to place the order.', 'weblogbaz-card-to-card-payment' ), false );
			syncPlaceOrderButton();
		}
	} );

	$( syncPlaceOrderButton );
}( jQuery ) );
