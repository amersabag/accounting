Meteor.methods({
	addTransaction: function(obj)
	{
		var amount = 0;
		if(!obj.fromAccount || !obj.toAccount || obj.fromAccount == obj.toAccount)
		{
			throw new Meteor.Error('You cannot have empty or the same from/to accounts!');
		}

		if(obj.dollarAmount)
		{
			amount += Number(obj.dollarAmount);
		}
		if(obj.tlAmount)
		{
			if(obj.dollarToTl)
			{
				amount += Number(obj.tlAmount) / Number(obj.dollarToTl);
			}
			else
			{
				throw new Meteor.Error('There is no dollar to tl ratio specified!');
			}
		}
		if(obj.euroAmount)
		{
			if(obj.dollarToEuro)
			{
				amount += Number(obj.euroAmount) / Number(obj.dollarToEuro);
			}
			else
			{
				throw new Meteor.Error('There is no dollar to euro ratio specified!');
			}
		}
		Transactions.insert({
			fromAccount: obj.fromAccount,
			toAccount: obj.toAccount,
			amount: Math.round(amount * 1000)/1000,
			dollarAmount: obj.dollarAmount,
			tlRatio: obj.dollarToTl,
			tlAmount: obj.tlAmount,
			euroRatio: obj.dollarToEuro,
			euroAmount: obj.euroAmount,
			date: new Date(obj.date),
			category: obj.category,
			invoiceLink: obj.invoiceLink,
			description: obj.description,
			note: obj.note,
			createdAt: new Date(),
			createdBy: Meteor.userId()
		});
		return false;
	}

});