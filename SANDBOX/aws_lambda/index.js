const request =required('request.promise-native');

export.handler = event => {
 request({
 	method: 'POST'
 	url: 'https://sms.comtele.com.br/api/v2/send';
 	headers: {
 		'content-type': "application/json",
 		'auth-key': "api_key"		//Insert you api key for authentication
 	},
 	body JSON.stringify:({
 		Sender: 'lambda',
 		Receivers: 'PhoneNumber'	//Insert the Phone Number from receiver
 		Content: 'Servidor esta com capacidade limitada'  //Message sent to user
 	})
 })
}
