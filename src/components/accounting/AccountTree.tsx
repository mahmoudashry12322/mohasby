'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  Plus,
  PencilSimple,
  FolderSimple,
  FileText,
  Lock,
  Prohibit,
  CheckCircle,
} from '@phosphor-icons/react';
import { AccountNode } from '@/app/api/accounts/route';
import { Badge } from '@/components/ui/Badge';

interface AccountTreeProps {
  accounts: AccountNode[];
  onAddChild: (parentCode: string) => void;
  onEdit: (account: AccountNode) => void;
  expandedKeys: Set<string>;
  toggleExpand: (code: string) => void;
}

interface TreeNodeProps {
  node: AccountNode;
  level: number;
  onAddChild: (parentCode: string) => void;
  onEdit: (account: AccountNode) => void;
  expandedKeys: Set<string>;
  toggleExpand: (code: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onAddChild,
  onEdit,
  expandedKeys,
  toggleExpand,
}) => {
  const t = useTranslations('coa');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = expandedKeys.has(node.code);

  const ArrowIcon = isExpanded
    ? CaretDown
    : isRtl
    ? CaretLeft
    : CaretRight;

  const isLevel1 = level === 1;
  const isLevel2 = level === 2;

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className={`group flex items-center justify-between py-2 px-3 my-0.5 rounded-lg transition-all duration-150 ${
          isLevel1
            ? 'bg-canvas border border-border/80 font-bold text-ink-900 shadow-xs'
            : isLevel2
            ? 'hover:bg-canvas/80 text-ink-900 font-semibold'
            : 'hover:bg-canvas/50 text-ink-900 text-sm'
        } ${!node.isActive ? 'opacity-50 line-through' : ''}`}
        style={{
          paddingInlineStart: `${(level - 1) * 20 + 8}px`,
        }}
      >
        {/* Left Side: Expand button + Code + Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Caret / Expand Icon */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.code)}
              className="w-6 h-6 rounded flex items-center justify-center text-ink-600 hover:bg-black/5 transition-colors shrink-0"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ArrowIcon size={14} weight="bold" />
            </button>
          ) : (
            <span className="w-6 h-6 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
            </span>
          )}

          {/* Node Icon */}
          <span className="shrink-0 text-ink-400 group-hover:text-green-700 transition-colors">
            {node.isGroup ? (
              <FolderSimple size={18} weight={hasChildren ? 'fill' : 'regular'} />
            ) : (
              <FileText size={16} />
            )}
          </span>

          {/* Account Code */}
          <span
            dir="ltr"
            className={`font-mono text-xs px-2 py-0.5 rounded tabular-nums shrink-0 ${
              isLevel1
                ? 'bg-green-700 text-white font-bold'
                : isLevel2
                ? 'bg-green-700/10 text-green-800 font-semibold'
                : 'bg-black/5 text-ink-600 font-medium'
            }`}
          >
            {node.code}
          </span>

          {/* Account Name */}
          <span
            className={`truncate ${
              isLevel1
                ? 'text-base font-kufi font-bold text-green-950'
                : isLevel2
                ? 'text-sm font-semibold text-ink-900'
                : 'text-xs text-ink-900'
            }`}
          >
            {node.name}
          </span>

          {/* Optional English Name */}
          {node.nameEn && (
            <span
              dir="ltr"
              className="text-[11px] text-ink-400 truncate hidden md:inline"
            >
              ({node.nameEn})
            </span>
          )}
        </div>

        {/* Right Side: Badges & Hover Actions */}
        <div className="flex items-center gap-2 shrink-0 ms-3">
          {/* Nature Badge */}
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              node.nature === 'مدين'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {node.nature}
          </span>

          {/* Statement Chip */}
          <span className="text-[10px] text-ink-600 bg-white border border-border px-2 py-0.5 rounded hidden sm:inline">
            {node.statementType}
          </span>

          {/* Balance (Tabular) */}
          <span
            dir="ltr"
            className="text-xs font-mono font-semibold text-ink-900 tabular-nums px-2 hidden lg:inline"
          >
            {node.balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>

          {/* Hover Actions Bar */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {node.isGroup && (
              <button
                type="button"
                onClick={() => onAddChild(node.code)}
                title={t('addChild')}
                className="w-7 h-7 rounded-md flex items-center justify-center text-green-700 bg-green-700/10 hover:bg-green-700 hover:text-white transition-all shadow-xs"
              >
                <Plus size={14} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(node)}
              title={t('edit')}
              className="w-7 h-7 rounded-md flex items-center justify-center text-ink-600 bg-canvas hover:bg-ink-900 hover:text-white transition-all shadow-xs"
            >
              <PencilSimple size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Recursive Children with indent lines */}
      {hasChildren && isExpanded && (
        <div
          className={`border-border/60 ${
            isRtl ? 'border-r-2 mr-3 pr-1' : 'border-l-2 ml-3 pl-1'
          }`}
        >
          {node.children!.map((child) => (
            <TreeNode
              key={child.code}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AccountTree: React.FC<AccountTreeProps> = ({
  accounts,
  onAddChild,
  onEdit,
  expandedKeys,
  toggleExpand,
}) => {
  const t = useTranslations('coa');

  if (accounts.length === 0) {
    return (
      <div className="py-16 text-center text-ink-600 text-sm">
        {t('noResults')}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {accounts.map((rootNode) => (
        <TreeNode
          key={rootNode.code}
          node={rootNode}
          level={1}
          onAddChild={onAddChild}
          onEdit={onEdit}
          expandedKeys={expandedKeys}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
};
