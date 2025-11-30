package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/jst/bom")
public class ComplexBomController {

    /**
     * 查询bom管理列表
     */
    @PreAuthorize("@ss.hasPermi('jst:bom:list')")
    @GetMapping("/list")
    public String list()
    {
        // 你的复杂逻辑代码
        List<Long> roleIds = new ArrayList<>();
        roleIds.add(1L);
        return "查询bom管理列表";
    }

    /**
     * 获取BOM详细信息
     * @param id BOM唯一标识
     * @return BOM详细信息
     */
    @GetMapping("/detail/{id}")
    public String getDetail(@PathVariable Long id) {
        return "BOM详情ID: " + id;
    }

    /**
     * 创建新的BOM物料清单
     * 接收BOM数据并创建新的物料清单
     * @param bom 包含BOM信息的JSON数据
     * @return 创建结果
     */
    @PostMapping("/create")
    public String createBom(@RequestBody String bom) {
        return "Created BOM: " + bom;
    }
}