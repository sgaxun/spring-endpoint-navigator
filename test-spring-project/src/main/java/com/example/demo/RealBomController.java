package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/jst/bom")
public class RealBomController {

    /**
     * 查询bom管理列表
     */
    @PreAuthorize("@ss.hasPermi('jst:bom:list')")
    @GetMapping("/list")
    public String list() {
        return "BOM List Data";
    }

    /**
     * 新增BOM物料清单
     * 添加新的物料信息到系统中
     */
    @PreAuthorize("@ss.hasPermi('jst:bom:add')")
    @PostMapping("/add")
    public String add(@RequestBody String bom) {
        return "Added BOM: " + bom;
    }

    /**
     * 修改BOM物料清单
     * 更新现有的物料信息
     */
    @PreAuthorize("@ss.hasPermi('jst:bom:edit')")
    @PostMapping("/edit")
    public String edit(@RequestBody String bom) {
        return "Edited BOM: " + bom;
    }

    /**
     * 删除BOM物料清单
     * 从系统中移除指定的物料信息
     */
    @PreAuthorize("@ss.hasPermi('jst:bom:remove')")
    @PostMapping("/remove")
    public String remove(@RequestBody String bomIds) {
        return "Removed BOM: " + bomIds;
    }
}