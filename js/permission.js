define(['utils'], function() {

  return angular.module('PermissionModule', ['UtilsModule']).factory('perm',
      function(utils) {
    return {
      user: null,
      ROLES: {
        STUDENT: 0x7,
        LEADER: 0xF,
        TEACHER: 0x3F,
        INSPECTION: 0x55,
        ADMIN: 0xFF
      },
      permissions: {
        0xFF: '管理员',  //4: 11111111  rw all data
        0x55: '学院督查', //4: 01010101 r
        0x17: '辅导员', //3: 010111    r class year data
        0xF: '组长',    //2: 1111     rw class data
        0x7: '学员'    //2: 0111       rw own data, r class data
      },
      isAdmin: function() {
        if (!this.user) return false;
        return this.user.permission > this.ROLES.STUDENT;
      },
      canRead: function(classInfo) {
        if (!this.user) return false;

        if (classInfo.teacher_id == this.user.id || !classInfo.perm_level) {
          return true;
        }

        return this.user.permission >> ((classInfo.perm_level - 1) * 2);
      },
      canWrite: function(classInfo) {
        if (!this.user) return false;

        if (classInfo.teacher_id == this.user.id || !classInfo.perm_level) {
          return true;
        }

        return (this.user.permission >> ((classInfo.perm_level - 1) * 2)) & 2;
      },
      level: function(permission) {
        var result = 0;
        for (;permission > 0; result++) {
          permission = (permission >> 2);
        }
        
        return result;
      },
      lowerPermissions: function() {
        var that = this;
        return utils.where(utils.keys(this.permissions), function(perm) {
          return that.canGrant(perm);
        });
      },
      canGrant: function(perm) {
        if (!this.user) return false;
        return perm <= this.user.permission;
      },
      isSysAdmin: function() {
        return this.user && this.user.permission >= this.ROLES.ADMIN;
      }
    };
  });
});
