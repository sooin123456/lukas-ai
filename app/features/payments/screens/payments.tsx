/**
 * Subscription Plans Screen
 *
 * This component displays available subscription plans for Lukas AI
 * and allows users to upgrade their plan.
 */
import type { Route } from "./+types/payments";

import { Check, Crown, Star } from "lucide-react";
import { Form, Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Badge } from "~/core/components/ui/badge";
import { getSubscriptionPlans, getUserSubscription } from "../queries";
import { requireDepartmentManager } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the subscription plans page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `구독 플랜 | Lukas AI`,
    },
  ];
};

/**
 * Loader function for subscription plans
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireDepartmentManager(client);
  
  const { data: { user } } = await client.auth.getUser();
  const plans = await getSubscriptionPlans();
  const userSubscription = user ? await getUserSubscription(user.id) : null;

  return {
    plans,
    currentSubscription: userSubscription,
  };
}

/**
 * Subscription Plans Component
 */
export default function Payments({ loaderData }: Route.ComponentProps) {
  const { plans, currentSubscription } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">구독 플랜</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          부서장을 위한 AI 기반 업무 도구를 선택하세요. 
          무료 플랜으로 시작하고 필요에 따라 업그레이드하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <Card className="relative">
          {!currentSubscription && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
              현재 플랜
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              베이직 플랜
            </CardTitle>
            <CardDescription>
              개인 부서장을 위한 기본 기능
            </CardDescription>
            <div className="text-3xl font-bold">
              ₩0<span className="text-lg text-muted-foreground">/월</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>문서 분석: 월 50건</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>회의 정리: 월 25건</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>기본 AI 모델</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>이메일 지원</span>
              </li>
            </ul>
            
            {!currentSubscription ? (
              <Button className="w-full" variant="outline" disabled>
                현재 플랜
              </Button>
            ) : (
              <Button className="w-full" variant="outline" asChild>
                <Link to="/users/dashboard">대시보드로 이동</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-primary">
          {currentSubscription && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
              현재 플랜
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              프로 플랜
            </CardTitle>
            <CardDescription>
              무제한 사용과 고급 기능
            </CardDescription>
            <div className="text-3xl font-bold">
              ₩13,000<span className="text-lg text-muted-foreground">/월</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>문서 분석: 무제한</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>회의 정리: 무제한</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>고급 AI 모델</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>우선순위 지원</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>고급 분석 기능</span>
              </li>
            </ul>
            
            {currentSubscription ? (
              <Button className="w-full" variant="outline" disabled>
                현재 플랜
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <Link to="/payments/checkout?plan=pro">
                  프로 플랜 시작하기
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          언제든지 플랜을 변경하거나 취소할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
