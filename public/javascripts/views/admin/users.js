//
// Users view
//
define([
    "i18n",
    "text!templates/admin/users.html",
    "views/user/viewer",
    "views/user/editor"
], function(i18n, template, UserViewer, UserEditor) {
    console.log('views/admin/users.js');
    var View = Backbone.View.extend({
        events: {
            "click .user-info": "doUserInfo"
        },
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                userViewer: new UserViewer(),
                userEditor: new UserEditor()
            };
        },
        destroy: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);

            // Menu events
            this.$Menu = $('#users-menu');
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "add":
                            self.doAdd();
                            break;
                        case "edit":
                            self.doEdit();
                            break;
                        case "remove":
                            self.doRemove();
                            break;
                        case "send":
                            self.doSend();
                            break;
                        case "import":
                            self.doImport();
                            break;
                        case "export":
                            self.doExport();
                            break;
                    }
                }
            });

            this.$TextSearch = this.$(".text-search");
            this.$TextSearch.searchbox({
                searcher: this.doSearch.bind(this)
            });

            this.$Grid = this.$("#users-grid");
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'username',
                        title: i18n.t('admin.users.username'),
                        width: 100,
                        sortable: true
                    }, {
                        field: 'provider',
                        title: i18n.t('admin.users.provider'),
                        width: 100,
                        sortable: true
                    }, {
                        field: 'fullname',
                        title: i18n.t('admin.users.fullname'),
                        width: 200,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: self.formatName.bind(this)
                    }, {
                        field: 'role',
                        title: i18n.t('admin.users.role'),
                        width: 100,
                        sortable: true,
                        formatter: self.formatRole.bind(this)
                    }, {
                        field: 'created',
                        title: i18n.t('admin.users.created'),
                        width: 100,
                        sortable: true,
                        formatter: self.formatDate.bind(this)
                    }, {
                        field: 'active',
                        title: i18n.t('admin.users.activeTitle'),
                        width: 100,
                        sortable: true,
                        formatter: self.formatActive.bind(this)
                    }]
                ],
                remoteSort: false,
                pagination: true,
                pageNumber: 1,
                pageSize: 50,
                pageList: [10, 50, 100, 250, 500, 1000, 10000],
                rownumbers: true,
                ctrlSelect: true,
                url: 'admin/users',
                method: 'get',
                loadFilter: function(data) {
                    data = data || [];
                    var text = self.$TextSearch.textbox('getValue').trim();
                    if (_.isEmpty(text)) return data;
                    else {
                        var rows = _.textSearch(data.rows, text);
                        return {
                            rows: rows,
                            total: rows.length
                        };
                    }
                }
            });

            return this;
        },
        formatName: function(val, row) {
            if (!row) return;
            var data = {
                i18n: i18n,
                row: row
            };
            var tpl = _.template(this.templates['user-item-tpl']);
            return tpl(data);
        },
        formatDate: function(val, row) {
            if (!val) return;
            return moment(val).format('DD.MM.YYYY');
        },
        formatActive: function(val, row) {
            switch (val) {
                case true:
                    return "<span style='color:green;'>" + i18n.t('user.active.true') + "</span>";
                case false:
                    return "<span style='color:purple;'>" + i18n.t('user.active.false') + "</span>";
            }
        },
        formatRole: function(val, row) {
            switch (val) {
                case 1:
                    return i18n.t('user.role.1');
                case 2:
                    return i18n.t('user.role.2');
                case 3:
                    return i18n.t('user.role.3');
            }
            return val;
        },
        doSearch: function() {
            this.$Grid.datagrid('reload');
        },
        doUserInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.userViewer.doOpen(userId);
        },
        doAdd: function() {
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.userEditor.doOpen(null, callback);
        },
        doEdit: function() {
            var selected = this.$Grid.datagrid('getSelected');
            if (!selected) return;
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.userEditor.doOpen(selected._id, callback);
        },
        removeRows: function(rows) {
            var self = this;
            var User = Backbone.Model.extend({
                urlRoot: 'user'
            });
            var onProgress = _.progressMessager(
                i18n.t('admin.remove.progressMsg'),
                rows.length,
                function() {
                    self.$Grid.datagrid('reload');
                });
            rows.forEach(function(row, i, arr) {
                _.defer(function() {
                    var user = new User({
                        _id: row._id
                    });
                    user.destroy({
                        success: onProgress,
                        error: onProgress
                    });
                });
            });
        },
        doRemove: function() {
            var selected = this.$Grid.datagrid('getSelections');
            if (!selected.length) return;
            var self = this;
            $.messager.confirm(i18n.t('admin.remove.confirm.title'),
                i18n.t('admin.remove.confirm.message'),
                function(r) {
                    if (r) self.removeRows(selected);
                });
        },
        doImport: function() {
            var csv = 'Другой,admin2,Администратор,Системы,Мужской,19.11.1986,admin@example.com,,,,,,,3,,admin2,local\n' +
                'Еще,admin3,Один,Админитсратор,Женский,19.11.1976,admin@example.com,,,,,,,3,,admin3,local';
            $.ajax({
                type: "POST",
                url: "/user/import",
                data: {"data": csv},
                success: function(ans){
                    if (ans == "OK") {
                        console.log("in");
                        window.location.reload();
                    }
                }
            });    
        },
        doExport: function() {
            var collection = this.$Grid.datagrid('getData').rows;
            console.log(JSON.stringify(collection));
            JSONToCSVConvertor(collection, true);
        }
    });
    function JSONToCSVConvertor(jsonObject, ShowLabel) {
    
        var array = typeof jsonObject != "object" ? JSON.parse(jsonObject) : jsonObject;
        
        if (array == null) {
            return; // No data found on the jsonObject
        }

        var str = "\uFEFF";
        
        if (ShowLabel) {
            var row = "";
            
            //This loop will extract the label from 1st index of on array
            for (var index in array[0]) {
                
                //Now convert each value to string and comma-seprated
                row += index + ',';
            }
    
            row = row.slice(0, -1);
            
            //append Label row with line break
            str += row + '\r\n';
    }
    
        for (var i = 0; i < array.length; i++) {
            var line = "";
    
            for (var index in array[i]) {
                line += array[i][index] + ","; // Set delimiter
            }
    
            // Here is an example where you would wrap the values in double quotes
            // for (var index in array[i]) {
            //    line += '"' + array[i][index] + '",';
            // }
    
            line.slice(0,line.Length-1); 
    
            str += line + "\r\n";
        }
    
        var uri = 'data:text/csv;charset=utf-8,' + encodeURI(str);

        var downloadLink = document.createElement("a");
        downloadLink.href = uri;
        downloadLink.download = "users_data.csv";
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    return View;
});