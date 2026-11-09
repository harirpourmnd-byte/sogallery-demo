( function () {
	'use strict';

	var registry = window.wc && window.wc.wcBlocksRegistry;
	var settings = window.wc && window.wc.wcSettings;
	var element = window.wp && window.wp.element;
	var dataApi = window.wp && window.wp.data;
	var i18n = window.wp && window.wp.i18n;

	if ( ! registry || ! settings || ! element || ! i18n ) {
		return;
	}

	var data = settings.getPaymentMethodData ? settings.getPaymentMethodData( 'weblogbaz_card_to_card', {} ) : settings.getSetting( 'weblogbaz_card_to_card_data', {} );
	var __ = i18n.__;
	var h = element.createElement;
	var useState = element.useState;
	var useEffect = element.useEffect;

	function money( totals ) {
		if ( ! totals || ! totals.total_price ) {
			return '';
		}
		var value = Number( totals.total_price ) / Math.pow( 10, Number( totals.currency_minor_unit || 0 ) );
		try {
			return new Intl.NumberFormat( undefined, { style: 'currency', currency: totals.currency_code || 'IRR' } ).format( value );
		} catch ( error ) {
			return String( value );
		}
	}

	function Content( props ) {
		var tokenState = useState( '' );
		var token = tokenState[ 0 ];
		var setToken = tokenState[ 1 ];
		var messageState = useState( __( 'Select receipt', 'weblogbaz-card-to-card-payment' ) );
		var message = messageState[ 0 ];
		var setMessage = messageState[ 1 ];
		var totals = dataApi && dataApi.useSelect ? dataApi.useSelect( function ( select ) { return select( 'wc/store/cart' ).getCartTotals(); }, [] ) : null;

		useEffect( function () {
			if ( ! props.eventRegistration || ! props.eventRegistration.onPaymentSetup ) {
				return undefined;
			}
			return props.eventRegistration.onPaymentSetup( function () {
				if ( ! token ) {
					return { type: props.emitResponse.responseTypes.ERROR, message: __( 'A payment receipt upload is required to place the order.', 'weblogbaz-card-to-card-payment' ) };
				}
				return { type: props.emitResponse.responseTypes.SUCCESS, meta: { paymentMethodData: { weblogbaz_receipt_token: token } } };
			} );
		}, [ token ] );

		function upload( event ) {
			var file = event.target.files && event.target.files[ 0 ];
			var form = new FormData();

			if ( ! file ) {
				return;
			}
			form.append( 'action', 'weblogbaz_card_to_card_prepare_receipt' );
			form.append( 'nonce', data.upload_nonce );
			form.append( 'weblogbaz_receipt', file );
			setMessage( __( 'Uploading...', 'weblogbaz-card-to-card-payment' ) );
			fetch( data.upload_url, { method: 'POST', body: form, credentials: 'same-origin' } ).then( function ( response ) { return response.json(); } ).then( function ( result ) {
				if ( ! result.success ) {
					throw new Error( result.data && result.data.message ? result.data.message : __( 'The payment receipt upload failed.', 'weblogbaz-card-to-card-payment' ) );
				}
				setToken( result.data.token );
				setMessage( __( 'Payment receipt uploaded successfully.', 'weblogbaz-card-to-card-payment' ) );
			} ).catch( function ( error ) { setToken( '' ); setMessage( error.message ); } );
		}

		var rows = [
			[ __( 'Amount to pay', 'weblogbaz-card-to-card-payment' ), money( totals ) ],
			[ __( 'Account holder', 'weblogbaz-card-to-card-payment' ), data.account_holder ],
			[ __( 'Bank', 'weblogbaz-card-to-card-payment' ), data.bank_name ],
			[ __( 'Card number', 'weblogbaz-card-to-card-payment' ), data.card_number ],
			[ __( 'Account number', 'weblogbaz-card-to-card-payment' ), data.account_number ],
			[ __( 'IBAN', 'weblogbaz-card-to-card-payment' ), data.iban ]
		];

		return h( 'div', { className: 'weblogbaz-card-to-card-payment-panel', dir: document.documentElement.dir || 'ltr' },
			h( 'h3', null, __( 'Card to Card Payment', 'weblogbaz-card-to-card-payment' ) ),
			h( 'p', null, __( 'Transfer the order amount using the payment information below, then upload your payment receipt.', 'weblogbaz-card-to-card-payment' ) ),
			h( 'h4', null, __( 'Payment information', 'weblogbaz-card-to-card-payment' ) ),
			h( 'dl', { className: 'weblogbaz-card-to-card-payment-details' }, rows.map( function ( row ) { return row[ 1 ] ? h( 'div', { key: row[ 0 ] }, h( 'dt', null, row[ 0 ] ), h( 'dd', { dir: 'ltr' }, row[ 1 ] ) ) : null; } ) ),
			h( 'h4', null, __( 'Payment receipt', 'weblogbaz-card-to-card-payment' ) ),
			h( 'label', { htmlFor: 'weblogbaz-card-to-card-payment-file' }, __( 'Select receipt', 'weblogbaz-card-to-card-payment' ) ),
			h( 'input', { id: 'weblogbaz-card-to-card-payment-file', type: 'file', accept: '.jpg,.jpeg,.png,.pdf', onChange: upload } ),
			h( 'p', null, __( 'Allowed formats: JPG, JPEG, PNG, and PDF — maximum size: 5 MB', 'weblogbaz-card-to-card-payment' ) ),
			h( 'p', { role: 'status', 'aria-live': 'polite' }, message )
		);
	}

	registry.registerPaymentMethod( { name: 'weblogbaz_card_to_card', label: h( 'span', null, data.title || __( 'Card to Card Payment', 'weblogbaz-card-to-card-payment' ) ), content: Content, edit: Content, canMakePayment: function () { return true; }, ariaLabel: data.title || __( 'Card to Card Payment', 'weblogbaz-card-to-card-payment' ), supports: { features: [] } } );
}() );
