Meteor.startup(function(){
	var user = Meteor.users.findOne();
	if(!Transactions.find().count() && user)
	{
		var transactions = [

		];
		transactions.forEach(function(transaction){
			transaction.project = 'ZadGroup';
			transaction.createdAt = transaction.date;
			transaction.createdBy = user._id;
			Transactions.insert(transaction);
		})
	}
});