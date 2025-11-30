package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 示例控制器
 * 提供基本的用户和订单操作端点
 */
@RestController
@RequestMapping("/api/example")
public class ExampleController {

    /**
     * 获取示例数据
     */
    @GetMapping("/data")
    public String getExampleData() {
        return "Example data";
    }

    /**
     * 创建示例资源
     */
    @PostMapping("/create")
    public String createExample() {
        return "Example created";
    }
}