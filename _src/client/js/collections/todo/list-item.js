define(function(require){
    "use strict";

	var BaseCollection = require('collections/base/collection');
	var TodoListItemModel = require('models/todo/list-item');

    var ListItemCollection = BaseCollection.extend({

		initialize: function(){
			ListItemCollection.__super__.initialize.apply(this, arguments);
			console.log("propModel:", this.propModel);
			this.listId = this.propModel.get("listId");
		},

		url: function(){
			return "/server/todo/" + this.listId + "/item/";
		},

        model: TodoListItemModel,

        comparator: function (model) {
            return model.get("sortOrder");
        }

    });

	return ListItemCollection;

});