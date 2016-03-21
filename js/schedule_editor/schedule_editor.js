define('schedule_editor/schedule_editor',
    ['course_editor_dialog/course_editor_dialog',
     'editable_label/editable_label',
    'schedule_group_editor/schedule_group_editor', 'services',
    'user_picker/user_picker', 'utils'], function() {

  return angular.module('ScheduleEditorModule',
      ['CourseEditorDialogModule', 'EditableLabelModule',
       'ScheduleGroupEditorModule', 'ServicesModule', 'UserPickerModule',
       'UtilsModule']).directive('scheduleEditor', function(rpc, utils) {
          return {
            scope: {
              classId: '='
            },
            link: function($scope) {
              $scope.week = 1000*3600*24*7;
              
              $scope.getWeeklyTime = function(group, index) {
                return utils.getWeeklyTime(group.start_time, index);
              };
              
              $scope.$watch('classId', function() {
                if (!$scope.classId) return;
                $scope.loadSchedules();
              });
              
              $scope.loadSchedules = function() {
                return rpc.get_schedules($scope.classId)
                    .then(function(response) {
                  $scope.schedule_groups = response.data.groups;
                  $scope.users = {};
                  for (var id in response.data.users) {
                    $scope.users[id] = response.data.users[id].name;
                  }
                  
                  $scope.schedule_groups[0] = {
                    id: 0,
                    classId: $scope.classId,
                    course_group: 0,
                    name: '新的学修安排模板',
                    start_time: utils.unixTimestamp(utils.getDefaultStartTime())
                  };

                  return $scope.schedule_groups;
                });
              };
              
              $scope.update = function(schedule, key, value) {
                schedule[key] = value;
                rpc.update_schedule(schedule);
              };
              $scope.editGroup = function(group) {
                group.editing = true;
              };
              $scope.removeGroup = function(group) {
                if (group.schedules &&
                    utils.positiveKeys(group.schedules).length > 0) {
                  alert('要先删除每节安排，才能删除该组');
                  return;
                }
                
                rpc.remove_schedule_group(group.id).then(function(response) {
                  if (parseInt(response.data.deleted)) $scope.loadSchedules();
                });
              };
              $scope.remove = function(schedule) {
                rpc.remove_schedule(schedule.id).then(function(response) {
                  if (parseInt(response.data.deleted)) $scope.loadSchedules();
                });
              };
              $scope.vacation = function(schedule) {
                return !schedule.course_id || !parseInt(schedule.course_id);
              };
              window.dragSchedule = function(event) {
                event.dataTransfer.setData("text", event.target.id);
              };
              window.dropSchedule = function(event) {
                event.preventDefault();
                var idToDrop = event.dataTransfer.getData("text");
                var element = event.target;
                var isAcceptingRow = function(element) {
                  return element.id &&
                    element.className.indexOf('css-table-row') >= 0;
                };
                while (element && !isAcceptingRow(element)) {
                  element = element.parentElement;
                }
                if (!element) return;
                
                $scope.insertSchedule(parseInt(idToDrop), parseInt(element.id));
                $scope.$apply();
              };
              window.allowDrop = function(event) {
                event.preventDefault();
              };
              
              /// Moves a schedule identified by [scheduleId] to the position
              /// after the schedule indentified by [insertAfter].
              $scope.insertSchedule = function(scheduleId, insertAfter) {
                if (scheduleId == insertAfter ||
                    scheduleId == insertAfter + 1) return;

                var group = $scope.findGroup(scheduleId);
                if (!group || group != $scope.findGroup(insertAfter)) return;
                
                var schedules = group.schedules;
                var schedule = angular.copy(schedules[scheduleId]);
                
                var id;
                if (scheduleId < insertAfter) {
                  for (id = scheduleId; id < insertAfter; id++) {
                    schedules[id] = schedules[id+1];
                    schedules[id].id = id;
                  }
                } else {
                  for (id = scheduleId; id > insertAfter+1; id--) {
                    schedules[id] = schedules[id-1];
                    schedules[id].id = id;
                  }
                } 
                schedule.id = id;
                schedules[id] = schedule;
                $scope.editGroup(group);
              };
              
              $scope.copySchedule = function(scheduleTo, scheduleFrom) {
                scheduleTo.course_id = scheduleFrom.course_id;
                scheduleTo.open = scheduleFrom.open;
                scheduleTo.review = scheduleFrom.review;
              };
              
              /// Returns the containing schedule group for a schedule.
              $scope.findGroup = function(scheduleId) {
                for (var id in $scope.schedule_groups) {
                  var group = $scope.schedule_groups[id];
                  
                  for (var sId in group.schedules) {
                    if (sId == scheduleId) return group;
                  }
                }
              };
            },
            templateUrl : 'js/schedule_editor/schedule_editor.html'
          };
        });
});
