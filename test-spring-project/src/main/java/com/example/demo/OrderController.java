package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    /**
     * 查询订单管理列表
     */
    @PreAuthorize("@ss.hasPermi('orders:list')")
    @GetMapping("/list")
    public String list() {
        return "Orders List Data";
    }

    /**
     * 新增订单
     * 添加新的订单信息到系统中
     */
    @PreAuthorize("@ss.hasPermi('orders:add')")
    @PostMapping("/add")
    public String add(@RequestBody String order) {
        return "Added Order: " + order;
    }

    /**
     * 修改订单
     * 更新现有的订单信息
     */
    @PreAuthorize("@ss.hasPermi('orders:edit')")
    @PostMapping("/edit")
    public String edit(@RequestBody String order) {
        return "Edited Order: " + order;
    }

    /**
     * 删除订单
     * 从系统中移除指定的订单信息
     */
    @PreAuthorize("@ss.hasPermi('orders:remove')")
    @PostMapping("/remove")
    public String remove(@RequestBody String orderIds) {
        return "Removed Orders: " + orderIds;
    }
}