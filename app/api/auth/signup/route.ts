import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, username, email, password, phone_number, province_id, location_id } = body

    // Basic validation
    if (!full_name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, username, email aur password zaroori hain.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password kam az kam 8 characters ka hona chahiye.' },
        { status: 400 }
      )
    }

    const db = createAdminClient()

    // Check: email already exist karta hai?
    const { data: existingEmail } = await db
      .from('users')
      .select('user_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Yeh email pehle se registered hai. Login karein ya doosra email use karein.' },
        { status: 409 }
      )
    }

    // Check: username already exist karta hai?
    const { data: existingUsername } = await db
      .from('users')
      .select('user_id')
      .eq('username', username.trim())
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Yeh username pehle se liya ja chuka hai. Doosra username try karein.' },
        { status: 409 }
      )
    }

    // Password hash karo
    const password_hash = await bcrypt.hash(password, 12)

    // Default role: student (role_id = 1 — adjust karo agar alag ho)
    const { data: roles } = await db
      .from('roles')
      .select('role_id')
      .eq('role_name', 'student')
      .maybeSingle()

    const role_id = roles?.role_id ?? 1

    // User insert karo
    const { data: newUser, error: insertError } = await db
      .from('users')
      .insert({
        full_name: full_name.trim(),
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        phone_number: phone_number?.trim() || null,
        province_id: province_id || null,
        location_id: location_id || null,
        role_id,
        is_active: true,
        is_verified: false,
        streak_days: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })
      .select('user_id, full_name, username, email, role_id, is_active, is_verified, created_at')
      .single()

    if (insertError) {
      console.error('[Signup] DB insert error:', insertError)
      return NextResponse.json(
        { error: 'Account banana mein error aya. Dobara try karein.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Account successfully ban gaya!',
        user: newUser,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[Signup] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Server error. Thori der baad try karein.' },
      { status: 500 }
    )
  }
}
