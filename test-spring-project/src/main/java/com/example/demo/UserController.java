package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/users")
public class UserController {

    /**
     * 获取用户列表
     * 返回所有用户的信息
     */
    @GetMapping("/list")
    public String getUserList() {
        return "User List";
    }

    /**
     * 创建新用户
     * 接收用户数据并创建新的用户记录
     */
    @PostMapping("/create")
    public String createUser(@RequestBody String user) {
        return "Created User: " + user;
    }

    /**
     * 查询用户详细信息
     * 根据ID获取特定用户的完整信息
     */
    @GetMapping("/detail/{id}")
    public String getUserDetail(@PathVariable String id) {
        return "User Detail for ID: " + id;
    }
}