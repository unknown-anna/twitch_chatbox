var wheatChatBox = {
	
	channelName: '',
	chatFrameElement: null,
	ComfyJS: {},
	configs: {
		chatCount: 0,
		chatNumLimit: 4,
		theme: 'default',
		useUserColor: false,
		winNumber: 0,
		randomNum: 50,
		debug: false
	},
	ignoreUserNames: [
		'blerp',
		'Nightbot',
		'Streamlabs',
		'SoundAlerts',
		'StreamElements'
	],
	SystemUserNames: {
		'ban' : 'Guard the Bonkstick',
	},
	timeoutMsgs: [
		'[username] got warned. Now you behave.',
	],
	banMsgs: [
		'[username] got bonked. Be well.',
	],

	Init: function(
		channelName,
		chatFrameId, 
		configs = {},
		) {
		if(channelName == undefined) {
			throw new Error( "Channel name is null" );
		}
		if(chatFrameId == undefined) {
			throw new Error( "DOM id to is null" );
		}
		let chatFrameElement = document.querySelector(`#${chatFrameId}`);
		if(chatFrameElement == null) {
			throw new Error( "Can not find the element by ID" );
		}
		if(typeof(ComfyJS) != 'object') {
			throw new Error( "You need comfyJS to use this chatbox" );
		}
		if(configs != undefined && typeof(configs) != 'object') {
			throw new Error( "configs are supposed to be object.");
		}

		if(configs.chatNumLimit != null && !isNaN(configs.chatNumLimit)) {
			wheatChatBox.configs.chatNumLimit = configs.chatNumLimit;
		}
		if(configs.theme != null  && typeof(configs.theme) == 'string') {
			wheatChatBox.configs.theme = configs.theme;
		}
		if(configs.useUserColor != null && typeof(configs.useUserColor) == 'boolean') {
			wheatChatBox.configs.useUserColor = configs.useUserColor;
		}
		if(configs.winNumber != null && !isNaN(configs.winNumber)) {
			wheatChatBox.configs.winNumber = configs.winNumber;
		}
		if(configs.randomNum != null && !isNaN(configs.randomNum)) {
			wheatChatBox.configs.randomNum = configs.randomNum;
		}
		if(configs.debug != null && typeof(configs.debug) == 'boolean') {
			wheatChatBox.configs.debug = configs.debug;
		}

		wheatChatBox.channelName = channelName;
		chatFrameElement.classList.add('chat-frame');
		wheatChatBox.chatFrameElement = chatFrameElement;
		wheatChatBox.ComfyJS = ComfyJS;
		wheatChatBox.configs.chatCount = 0;


		ComfyJS.Init( wheatChatBox.channelName );
		ComfyJS.onChat = ( userName, message, flags, self, extra ) => {
			if(wheatChatBox.ignoreUserNames.find(
				(ignoreUserNames) => ignoreUserNames == userName) != undefined
			) {
				return;
			} else {

				userName = wheatChatBox.escapeHtml(userName);
				message = wheatChatBox.escapeHtml(message);
				let userBadgesHtml = wheatChatBox.createUserBadges(extra.userBadges, flags);
				let userNameElmn = wheatChatBox.createUserNameElmn(extra['userColor']);

				let msgHtml = wheatChatBox.replaceMessage(message, extra.messageEmotes);
				let msgElmn = wheatChatBox.createMsgElmn(msgHtml);

				let addBubbleObj = {
					userName: userName,
					userNameElmn: userNameElmn,
					userBadgesHtml: userBadgesHtml,
					msgElmn: msgElmn,
					isSystemMsg: false,
				}
				wheatChatBox.addBubble(addBubbleObj);

				return;
			}
		}

		ComfyJS.onCheer = ( userName, message, bits, flags, extra ) => {
			// console.log(`${userName} cheered ${bits}: ${message}`)
			// console.log(extra);

			userName = wheatChatBox.escapeHtml(userName);
			message = wheatChatBox.escapeHtml(message);
			let userBadgesHtml = wheatChatBox.createUserBadges(extra.userBadges, flags);
			let userNameElmn = wheatChatBox.createUserNameElmn(extra['userColor']);

			let msgHtml = wheatChatBox.replaceMessage(message, extra.messageEmotes, bits);
			let msgElmn = wheatChatBox.createMsgElmn(msgHtml);

			let addBubbleObj = {
				userName: userName,
				userNameElmn: userNameElmn,
				userBadgesHtml: userBadgesHtml,
				msgElmn: msgElmn,
				isSystemMsg: false,
			}
			wheatChatBox.addBubble(addBubbleObj);

		}

		// ComfyJS.onSub = ( userName, message, subTierInfo, extra ) => {
			// console.log(`${userName} subed: ${message}`)
			// console.log(subTierInfo);
			// console.log(extra);
		// }

		// ComfyJS.onSubGift = ( gifterUser, streakMonths, recipientUser, senderCount, subTierInfo, extra ) => {
		//     console.log(`${gifterUser} gifted ${recipientUser}`)
		//     console.log(subTierInfo);
		//     console.log(extra);
		// }

		ComfyJS.onTimeout = ( timedOutUsername, durationInSeconds ) => {
			let userName = wheatChatBox.SystemUserNames.ban;
			let userNameElmn = wheatChatBox.createUserNameElmn();
			
			let msgHtml = `${timedOutUsername} got warned. Now you behave.`;
			let msgElmn = wheatChatBox.createMsgElmn(msgHtml);

			wheatChatBox.removeUserBubble(timedOutUsername);
			
			let addBubbleObj = {
				userName: userName,
				userNameElmn: userNameElmn,
				userBadgesHtml: '',
				msgElmn: msgElmn,
				isSystemMsg: true,
			}
			wheatChatBox.addBubble(addBubbleObj);

			return;
		}

		ComfyJS.onBan = ( bannedUsername ) => {
			let userName = wheatChatBox.SystemUserNames.ban;
			let userNameElmn = wheatChatBox.createUserNameElmn();

			let msgHtml = `${bannedUsername} got bonked. Be well.`;
			let msgElmn = wheatChatBox.createMsgElmn(msgHtml);

			wheatChatBox.removeUserBubble(bannedUsername);
			let addBubbleObj = {
				userName: userName,
				userNameElmn: userNameElmn,
				userBadgesHtml: '',
				msgElmn: msgElmn,
				isSystemMsg: true,
			}
			wheatChatBox.addBubble(addBubbleObj);

			return;
		}
		
	},

	getRandomInt: function (max) {
		return Math.floor(Math.random() * max);
	},

	escapeHtml: function (strings) {
		return strings
			 .replace(/&/g, "&amp;")
			 .replace(/</g, "&lt;")
			 .replace(/>/g, "&gt;")
			 .replace(/"/g, "&quot;")
			 .replace(/'/g, "&#039;");
	},
	
	createUserNameElmn: function (userColor='') {
		let userNameElmn = document.createElement('p');
			userNameElmn.classList.add('username');
		if(wheatChatBox.configs.useUserColor == true 
			&& userColor!=''
		) {
			userNameElmn.style.backgroundColor = userColor;
		}
	
		return userNameElmn;
	},
	
	createMsgElmn: function  (msgHtml) {
		let msgElmn = document.createElement('p');
			msgElmn.classList.add('msg');
			msgElmn.innerHTML = msgHtml;
	
		return msgElmn;
	
	},
	
	replaceMessage: function (msgInput, msgEmote, bits=0) {
		
		// Replacing Emote
		let msgHtml = msgInput;
		if(msgEmote != null) {
			for (const key in msgEmote) {
				let textStr = msgEmote[key][0].split('-');
					textStr[1]++;
				
				let emoteApi = 'https://static-cdn.jtvnw.net/emoticons/v2/'+key+'/default/dark/2.0';
				let emoteName = msgInput.substring(textStr[0], textStr[1]);
					emoteName = emoteName.replaceAll( ')', '\\\)' );
					emoteName = emoteName.replaceAll( '(', '\\\(' );
					emoteName = emoteName.replaceAll( '*', '\\\*' );
				let imgHtml = '<img src="'+emoteApi+'" />';
				let emoteNameRegex = new RegExp( `(?<![a-zA-Z0-9])${emoteName}(?![a-zA-Z0-9])`, "g");            
				msgHtml = msgHtml.replaceAll(emoteNameRegex, imgHtml);
			}
		}
	
		for (const betterttv in betterttvEmotes) {
			let imgHtml = '<img src="'+betterttvEmotes[betterttv]+'" alt="'+betterttv+'" />';
			let emoteNameRegex = new RegExp( `(?<![a-zA-Z0-9])${betterttv}(?![a-zA-Z0-9])`, "g");            
			msgHtml = msgHtml.replaceAll(emoteNameRegex, imgHtml);
		}
	
		for (const sevenTv in sevenTvEmotes) {
			let imgHtml = '<img src="'+sevenTvEmotes[sevenTv]+'" alt="'+sevenTv+'" />';
			let emoteNameRegex = new RegExp( `(?<![a-zA-Z0-9])${sevenTv}(?![a-zA-Z0-9])`, "g");            
			msgHtml = msgHtml.replaceAll(emoteNameRegex, imgHtml);
		}
	
		//Yo_Solo_Dolo cheered 1: just started watching bro, have you got all bell bearings to upgrade your weapon fully, also try getting the raksasha armour, it adds attack with every piece you wear. Cheer1
		if(bits > 0) {	
			for (const bits in bitsCheer) {
				let cheerNameRegex = new RegExp( `(?<![a-zA-Z0-9])${bits}(?![a-zA-Z0-9])`, "g");            
				msgHtml = msgHtml.replaceAll(cheerNameRegex, bitsCheer[bits]);
			}
		}
	
		// Replay and URL highlight
		let regexReply = /@[a-zA-z0-9\-]+/g;
		let msgReply = msgInput.match(regexReply);
		if(msgReply != null) {
			msgHtml = msgHtml.replace(msgReply,'<span class="reply">'+msgReply+'</span>');
		}
	
		let regexURL = /https:\/\/[a-zA-z0-9.\&\?\=\-\/\~#%\$]+/g;
		let msgURL = msgInput.match(regexURL);
		if(msgURL != null) {
			msgHtml = msgHtml.replace(msgURL,'<span class="url">'+msgURL+'</span>');
		}
		return msgHtml;
	},
	
	createUserBadges: function (arrObtainedBadge, flags) {
	
		if(arrObtainedBadge == null) {
			return '';
		}
	
		let userBadgesHtml = '';
	
		// Turbo
		if(arrObtainedBadge['turbo'] ) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['turbo']+'" alt="Turbo" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
	
		// Giftsubs
		if(arrObtainedBadge['sub-gifter'] != undefined) {
			if (arrObtainedBadge['sub-gifter'] <= 4 ) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs1']+'" alt="1 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] <= 9) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs5']+'" alt="5 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] <= 14) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs10']+'" alt="10 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			}  else if (arrObtainedBadge['sub-gifter'] <= 19) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs12']+'" alt="15 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 24) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs25']+'" alt="25 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 49) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs50']+'" alt="50 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 99) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs100']+'" alt="100 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 149) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs150']+'" alt="150 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 199) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs200']+'" alt="200 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 249) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs250']+'" alt="250 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 299) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs300']+'" alt="300 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 349) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs350']+'" alt="350 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 399) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs400']+'" alt="400 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 449) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs450']+'" alt="450 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 499) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs500']+'" alt="500 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 549) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs550']+'" alt="550 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 599) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs600']+'" alt="600 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gifter'] >= 649) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftsubs650']+'" alt="650 Gift Subs" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			}
		}
	
		if(arrObtainedBadge['sub-gift-leader'] != undefined) {
			if (arrObtainedBadge['sub-gift-leader'] == 1 ) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftleader1']+'" alt="Bits Leader 1st" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gift-leader'] == 2) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftleader2']+'" alt="Bits Leader 2nd" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['sub-gift-leader'] == 3) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['giftleader3']+'" alt="Bits Leader 3rd" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} 
		}
	
		// Bits/Cheer
		if(arrObtainedBadge['bits'] != undefined) {
			if (arrObtainedBadge['bits'] <= 99 ) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bits1']+'" alt="Cheer1" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['bits'] <= 999) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bits100']+'" alt="Cheer100" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['bits'] <= 9999) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bits1000']+'" alt="Cheer1000" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			}  else if (arrObtainedBadge['bits'] <= 99999) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bits10000']+'" alt="Cheer10000" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['bits'] >= 100000) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bits100000']+'" alt="Cheer100000" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			}
		}
		if(arrObtainedBadge['bits-leader'] != undefined) {
			if (arrObtainedBadge['bits-leader'] == 1 ) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bitsleader1']+'" alt="Bits Leader 1st" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['bits-leader'] == 2) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bitsleader2']+'" alt="Bits Leader 2nd" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['bits-leader'] == 3) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['bitsleader3']+'" alt="Bits Leader 3rd" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} 
		}
		
		if (arrObtainedBadge['premium'] != undefined) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['premium']+'" alt="Prime Gaming" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(arrObtainedBadge['twitch-recap-2023'] != undefined) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['twitchRecap2023']+'" alt="Twitch Recap 2023" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(arrObtainedBadge['superultracombo-2023'] != undefined) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['superultraCombo2023']+'" alt="Super Ultra Combo 2023" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(arrObtainedBadge['glitchcon2020'] != undefined) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['glitchcon2020']+'" alt="Glitchcon 2020" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(arrObtainedBadge['minecraft-15th-anniversary-celebration'] != undefined) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['minecraft15thAnniversaryCelebration']+'" alt="Glitchcon 2020" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
	
		// Status
		if(arrObtainedBadge['no_video'] != undefined ) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['no_video']+'" alt="Listening only" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(arrObtainedBadge['no_audio'] != undefined ) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['no_audio']+'" alt="Watching without audio" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		
		if(arrObtainedBadge['hype-train'] != undefined) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['hypeTrain1']+'" alt="Hype Train" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
	
		// Subs
		if(flags['subscriber'] == true) {
			if (arrObtainedBadge['subscriber'] <= 2) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['subscriber']+'" alt="Subscriber" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['subscriber'] <= 5) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['subscriber3']+'" alt="Subscriber" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['subscriber'] <= 8) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['subscriber6']+'" alt="Subscriber" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['subscriber'] <= 11) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['subscriber9']+'" alt="Subscriber" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			} else if (arrObtainedBadge['subscriber'] >= 12) {
				let imgHtml = '<span class="item"><img src="'+twitchBadge['subscriber12']+'" alt="Subscriber" /></span>';
				userBadgesHtml = imgHtml+userBadgesHtml;
			}
		}
	
		if(flags['broadcaster'] == true) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['broadcaster']+'" alt="Broadcaster" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(flags['mod'] == true) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['mod']+'" alt="Moderator" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(flags['vip'] == true) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['vip']+'" alt="VIP" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
		if(flags['founder'] == true) {
			let imgHtml = '<span class="item"><img src="'+twitchBadge['founder']+'" alt="Founder" /></span>';
			userBadgesHtml = imgHtml+userBadgesHtml;
		}
	
		return userBadgesHtml;
		
	},
	
	addBubble: function (addBubbleObj) {
	
		let rottely = wheatChatBox.getRandomInt(
				wheatChatBox.configs.randomNum
			);
		let bubble = document.createElement("div");
			bubble.classList.add('bubble');
			bubble.setAttribute('data-username', addBubbleObj.userName);
		if(addBubbleObj.isSystemMsg == true) {
			bubble.classList.add('system');
		} else if(rottely == wheatChatBox.configs.winNumber) {
			bubble.classList.add('bread');
		}
	
		let bubbleInner = document.createElement("div");
			bubbleInner.classList.add('bubble-inner');
	
		let userNameInner = document.createElement("div");
			userNameInner.classList.add('username-inner');
	
		let userBadgesElmn = document.createElement("p");
			userBadgesElmn.classList.add("badge")
		if(addBubbleObj.userBadgesHtml != '') {
			userBadgesElmn.innerHTML = addBubbleObj.userBadgesHtml;
		}
		
		switch(wheatChatBox.configs.theme) {
	
			case 'icecream':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubble.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'matrix':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubbleInner.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'notebook':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubbleInner.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'pixelart':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubbleInner.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'quate':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubbleInner.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'quateDark':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubbleInner.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'space':
				userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubble.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'cyberpunk':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubble.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'cyberpunkBadgeSplit':
				addBubbleObj.userNameElmn.innerHTML = userName;
				userNameInner.append(addBubbleObj.userNameElmn);
				userNameInner.append(userBadgesElmn);
				bubble.append(userNameInner);
				bubbleInner.append(msgElmn);
			break;
			case 'amethyst':
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubble.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
			case 'defaultBadgeSplit':
				addBubbleObj.userNameElmn.innerHTML = addBubbleObj.userName;
				userNameInner.append(addBubbleObj.userNameElmn);
				userNameInner.append(userBadgesElmn);
				bubble.append(userNameInner);
				bubbleInner.append(addBubbleObj.msgElmn);
			break;
	
			default:
				addBubbleObj.userNameElmn.innerHTML = 
					addBubbleObj.userBadgesHtml+addBubbleObj.userName;
				bubbleInner.append(addBubbleObj.userNameElmn);
				bubbleInner.append(addBubbleObj.msgElmn);
		}
			
		if(wheatChatBox.configs.chatCount >= wheatChatBox.configs.chatNumLimit) {
			chat.firstChild.remove();
			wheatChatBox.configs.chatCount--;
		}
	
		bubble.append(bubbleInner);
		wheatChatBox.chatFrameElement.append(bubble);
		if(wheatChatBox.configs.chatCount < wheatChatBox.configs.chatNumLimit) {
			wheatChatBox.configs.chatCount++;
		}
	
	},
	
	removeUserBubble: function (user) {
	
		let bubbleElmn = document.querySelectorAll(`.bubble[data-username="${user}"]`);
		if(bubbleElmn.length == 0) {
			return;
		}
	
		bubbleElmn.forEach(function(elmn, index) {
			elmn.remove();
			wheatChatBox.configs.chatCount--;
		});
	}

}
