var express = require('express');
var router = express.Router();
var db = require('../db');
var async = require("async");
// Import users
router.post('/import', function(req, res) {
    // var data = 'Другой,admin2,Администратор,Системы,Мужской,19.11.1986,admin@example.com,,,,,,,3,,admin2,local\n' +
    //             'Еще,admin3,Один,Админитсратор,Женский,19.11.1976,admin@example.com,,,,,,,3,,admin3,local';
    var data = req.body.data.split('\n');                                                                                                                                                     

    async.each(data, function(line, callback) {                                                                                                                                                
        line = line.split(',');
    
        var User = require('../db/models/user');    
        var user = new User({                                                                                                                                                         
            firstname: line[0],
            password: line[1],
            lastname: line[2],
            middlename: line[3],
            gender: line[4],
            birthday: line[5],
            email: line[6],
            citizenship: line[7],
            documentType: line[8],
            documentNumber: line[9],
            documentIssueDate: line[10],
            address: line[11],
            description: line[12],
            role: line[13],
            active: line[14],
            username: line[15],
            provider: line[16]                                                                                                                                                    
        });                                                                                                                                                                       
        
        user.save(function(err, item) {
            if (err) {
                console.log(err);
            }
            callback(); 
        });
    }); 
    res.end("OK");
});
// Get user info by id
router.get('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId
    };
    db.profile.get(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Update user
router.put('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId,
        data: req.body
    };
    db.profile.update(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Create user
router.post('/', function(req, res) {
    var args = {
        userId: req.params.userId,
        data: req.body
    };
    db.profile.add(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Delete user
router.delete('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId
    };
    db.profile.remove(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});

module.exports = router;