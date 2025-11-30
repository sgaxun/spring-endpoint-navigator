package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单控制器
 * 处理订单相关的HTTP请求
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    /**
     * 获取所有订单
     * @return 订单列表
     */
    @GetMapping("/")
    public String getAllOrders() {
        return "All orders";
    }

    /**
     * 根据ID获取订单
     * @param id 订单ID
     * @return 订单详情
     */
    @GetMapping("/{id}")
    public String getOrderById(@PathVariable Long id) {
        return "Order with ID: " + id;
    }

    /**
     * 创建新订单
     * @param orderData 订单数据
     * @return 创建结果
     */
    @PostMapping("/")
    public String createOrder(@RequestBody String orderData) {
        return "Order created";
    }
}