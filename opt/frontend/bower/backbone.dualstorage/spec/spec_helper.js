// Generated by CoffeeScript 1.6.3
(function() {
  window.Backbone.sync = jasmine.createSpy('sync').andCallFake(function(method, model, options) {
    var resp;
    model.updatedByRemoteSync = true;
    resp = options.serverResponse || model.toJSON();
    if (Backbone.VERSION === '0.9.10') {
      return options.success(model, resp, options);
    } else {
      return options.success(resp, 200, {});
    }
  });

}).call(this);
