import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function checkAuth(request: Request): boolean {
  if (!ADMIN_SECRET) return true; // No auth if not configured
  const authHeader = request.headers.get("authorization");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  return authHeader === `Bearer ${ADMIN_SECRET}` || urlSecret === ADMIN_SECRET;
}

// GET - List all sources
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.scraperSource.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(sources);
}

// POST - Create a new source
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, name, url, company, enabled } = body;

    if (!type || !name || !url) {
      return NextResponse.json(
        { error: "type, name, and url are required" },
        { status: 400 }
      );
    }

    const source = await prisma.scraperSource.create({
      data: {
        type,
        name,
        url,
        company: company || null,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create source" },
      { status: 500 }
    );
  }
}

// PUT - Update a source
export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, type, name, url, company, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const source = await prisma.scraperSource.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(name && { name }),
        ...(url && { url }),
        ...(company !== undefined && { company: company || null }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return NextResponse.json(source);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update source" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a source
export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.scraperSource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete source" },
      { status: 500 }
    );
  }
}
