define('new_user_dialog/new_user_dialog',
    ['importers', 'services', 'user_editor/user_editor'], function() {
  return angular.module('NewUserDialogModule', ['ImportersModule', 'ServicesModule',
      'UserEditorModule'])
    .directive('newUserDialog',
        function(importers, rpc) {
          return {
            scope: {},
            link: function(scope) {
              scope.user = null;

              scope.preview = function() {
                if (!scope.emailBody) return;

                var lines = scope.emailBody.split(/[\r\n]+/g);
                var headers = [], values = [];
                for (var row in lines) {
                  var line = lines[row];
                  var parts = line.split('：');
                  if (!parts[0] || !parts[1]) continue;

                  headers.push(parts[0].trim());
                  values.push(parts[1].trim());
                }

                var tsvText = headers.join('\t') + '\n' + values.join('\t');
                var callback = function(index, m, record, result) {
                  scope.user = result.records && result.records[0];
                };

                importers.userImporter.analyze(tsvText, callback, scope);
              };
              
              scope.save = function() {
                rpc.update_user(user).then(function(response) {
                  var submitted = (1 == response.data.updated);
                  if (submitted) {
                    document.getElementById('new-user-dlg').close();
                  } else {
                    scope.error = response.data.error;
                  }
                });
              };
            },
            templateUrl : 'js/new_user_dialog/new_user_dialog.html'
          };
        });
});

