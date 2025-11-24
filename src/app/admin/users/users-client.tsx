"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, CreditCard, ArrowRight, Crown } from "lucide-react";
import {
  getTierFromPriceId,
  getTierDisplayName,
} from "@/lib/tier-utils";

interface User {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
  subscriptions: Array<{
    id: number;
    provider: string;
    status: string;
    current_period_end: string | null;
    external_subscription_id: string | null;
    price_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=${pagination.limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchUsers(pagination.page + 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
      case "cancelled":
        return "bg-amber-100 text-amber-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="animate-pulse">
        {/* Search and Stats Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="h-10 bg-gray-200 rounded w-full max-w-md"></div>
          <div className="h-5 bg-gray-200 rounded w-48"></div>
        </div>
        {/* Users List Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {pagination.total} users
        </div>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => {
          const subscription = user.subscriptions[0];
          const tier = subscription
            ? getTierFromPriceId(subscription.price_id)
            : "FREE";

          return (
            <Link key={user.id} href={`/admin/users/${user.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <User className="h-8 w-8 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {user.email || "No email"}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-gray-400" />
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {getTierDisplayName(tier)}
                          </Badge>
                        </div>
                        {subscription && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <Badge
                              className={getStatusColor(subscription.status)}
                            >
                              {subscription.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Load More Button */}
      {pagination.page < pagination.totalPages && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
