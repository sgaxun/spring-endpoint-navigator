package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class TestController {

    /**
     * 获取所有用户列表
     * 返回系统中所有注册用户的信息
     */
    @GetMapping("/users")
    public List<String> getAllUsers() {
        return List.of("Alice", "Bob", "Charlie");
    }

    /**
     * 根据用户ID获取单个用户信息
     * @param id 用户唯一标识符
     * @return 用户详细信息
     */
    @GetMapping("/users/{id}")
    public String getUserById(@PathVariable Long id) {
        return "User " + id;
    }

    /**
     * 创建新用户
     * 接收用户信息并创建新的用户记录
     */
    @PostMapping("/users")
    public String createUser(@RequestBody String user) {
        return "Created: " + user;
    }

    /**
     * 更新现有用户信息
     * @param id 要更新的用户ID
     * @param user 更新的用户数据
     */
    @PutMapping("/users/{id}")
    public String updateUser(@PathVariable Long id, @RequestBody String user) {
        return "Updated user " + id + " with " + user;
    }

    /**
     * 删除指定用户
     * 从系统中永久删除用户记录
     */
    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable Long id) {
        return "Deleted user " + id;
    }
}