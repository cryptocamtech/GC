window._genesys = {
  widgets: {
    main: {
      preload: ['webchat'],
      theme: "light"
    },
    webchat: {
      chatButton: {
          enabled: true, // (boolean) Enable/disable chat button on screen.
          template: '<div>Live Chat</div>', // (string) Custom HTML string template for chat button.
          effect: 'fade',         // (string) Type of animation effect when revealing chat button. 'slide' or 'fade'.
          openDelay: 1000,        // (number) Number of milliseconds before displaying chat button on screen.
          effectDuration: 300,    // (number) Length of animation effect in milliseconds.
          hideDuringInvite: true  // (boolean) When auto-invite feature is activated, hide the chat button. When invite is dismissed, reveal the chat button again.
	    },
      transport: {
        type: 'purecloud-v2-sockets',
        dataURL: 'https://api.mypurecloud.com',     // replace with API URL matching your region
        deploymentKey : 'ed2ba6b9-f657-4696-b2e7-a214f21590a7',  // replace with your Deployment ID
        orgGuid : '79e797f6-adc0-4b56-92e8-0e399eae61aa',              // replace with your Organization ID
        interactionData: {
          routing: {
            targetType: 'QUEUE',
            targetAddress: 'Cam Chat Flow',
            priority: 2
          }
        }
      },
      userData: {
        addressStreet: '64472 Brown Street',
        addressCity: 'Lindgrenmouth',
        addressPostalCode: '50163-2735',
        addressState: 'FL',
        phoneNumber: '1-916-892-2045 x293',
        phoneType: 'Cell',
        surveyResult: 'OK',
        // These fields should be provided via advanced configuration
        // firstName: 'Praenomen',
        // lastName: 'Gens',
        // email: 'praenomen.gens@calidumlitterae.com',
        // subject: 'Chat subject'
      },
	  form: {
		  wrapper: "<table></table>",
		  inputs: [
			{
				id: "cx_webchat_form_firstname",
				name: "firstname",
				maxlength: "100",
				placeholder: "@i18n:webchat.ChatFormPlaceholderFirstName",
				label: "@i18n:webchat.ChatFormFirstName"
			},
			{
				id: "cx_webchat_form_lastname",
				name: "lastname",
				maxlength: "100",
				placeholder: "@i18n:webchat.ChatFormPlaceholderLastName",
				label: "@i18n:webchat.ChatFormLastName"
			},
			{
				id:"cx_webchat_form_phonenumber",
				name:"phonenumber",
				type:"text",
				maxlength:"100",
				placeholder:"Optional",
				label:"Phone Number"
			},
			{
				id: "cx_webchat_form_email", 
				name: "email", 
				maxlength: "100",
				placeholder: "@i18n:webchat.ChatFormPlaceholderEmail",
				label: "@i18n:webchat.ChatFormEmail"
			}
		   ]
       }
	}
  }
}
