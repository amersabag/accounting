Meteor.publish('transactions', function(){
	return Transactions.find({createdBy: this.userId});
});