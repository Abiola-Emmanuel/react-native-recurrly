import { icons } from '@/constants/icons'
import '@/global.css'
import { clsx } from 'clsx'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'

type CreateSubscriptionModalProps = {
  visible: boolean
  onClose: () => void
  onCreate: (subscription: Subscription) => void
}

const CATEGORY_OPTIONS = [
  'Entertainment',
  'AI Tools',
  'Developer Tools',
  'Design',
  'Productivity',
  'Cloud',
  'Music',
  'Other',
] as const

const CATEGORY_COLORS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  Entertainment: '#f5c542',
  'AI Tools': '#b8d4e3',
  'Developer Tools': '#e8def8',
  Design: '#b8e8d0',
  Productivity: '#f2c6a3',
  Cloud: '#c8ddff',
  Music: '#ffd6e0',
  Other: '#d9d4c7',
}

const DEFAULT_FREQUENCY = 'Monthly'
const DEFAULT_CATEGORY = 'Entertainment'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const CreateSubscriptionModal = ({ visible, onClose, onCreate }: CreateSubscriptionModalProps) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [frequency, setFrequency] = useState<'Monthly' | 'Yearly'>(DEFAULT_FREQUENCY)
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>(DEFAULT_CATEGORY)
  const [nameError, setNameError] = useState('')
  const [priceError, setPriceError] = useState('')

  const resetForm = () => {
    setName('')
    setPrice('')
    setFrequency(DEFAULT_FREQUENCY)
    setCategory(DEFAULT_CATEGORY)
    setNameError('')
    setPriceError('')
  }

  useEffect(() => {
    if (!visible) {
      resetForm()
    }
  }, [visible])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = () => {
    const trimmedName = name.trim()
    const parsedPrice = Number.parseFloat(price)

    let hasError = false

    if (!trimmedName) {
      setNameError('Name is required.')
      hasError = true
    } else {
      setNameError('')
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setPriceError('Enter a valid positive price.')
      hasError = true
    } else {
      setPriceError('')
    }

    if (hasError) {
      return
    }

    const startDate = dayjs()
    const renewalDate = startDate.add(1, frequency === 'Monthly' ? 'month' : 'year')

    onCreate({
      id: `${slugify(trimmedName) || 'subscription'}-${Date.now()}`,
      icon: icons.wallet,
      name: trimmedName,
      category,
      status: 'active',
      startDate: startDate.toISOString(),
      price: parsedPrice,
      currency: 'USD',
      billing: frequency,
      renewalDate: renewalDate.toISOString(),
      color: CATEGORY_COLORS[category],
    })

    resetForm()
    onClose()
  }

  const isSubmitDisabled = !name.trim() || !price.trim()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="modal-overlay" onPress={handleClose}>
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="modal-container" onPress={(event) => event.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>

              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">x</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="modal-body"
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value)
                    if (nameError && value.trim()) {
                      setNameError('')
                    }
                  }}
                  className={clsx('auth-input', nameError && 'auth-input-error')}
                  placeholder="Netflix"
                  placeholderTextColor="rgba(0, 0, 0, 0.45)"
                />
                {nameError ? <Text className="auth-error">{nameError}</Text> : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  value={price}
                  onChangeText={(value) => {
                    setPrice(value)
                    if (priceError && value.trim()) {
                      setPriceError('')
                    }
                  }}
                  className={clsx('auth-input', priceError && 'auth-input-error')}
                  placeholder="9.99"
                  placeholderTextColor="rgba(0, 0, 0, 0.45)"
                  keyboardType="decimal-pad"
                />
                {priceError ? <Text className="auth-error">{priceError}</Text> : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(['Monthly', 'Yearly'] as const).map((option) => {
                    const isActive = frequency === option

                    return (
                      <Pressable
                        key={option}
                        onPress={() => setFrequency(option)}
                        className={clsx('picker-option', isActive && 'picker-option-active')}
                      >
                        <Text className={clsx('picker-option-text', isActive && 'picker-option-text-active')}>
                          {option}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORY_OPTIONS.map((option) => {
                    const isActive = category === option

                    return (
                      <Pressable
                        key={option}
                        onPress={() => setCategory(option)}
                        className={clsx('category-chip', isActive && 'category-chip-active')}
                      >
                        <Text className={clsx('category-chip-text', isActive && 'category-chip-text-active')}>
                          {option}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
                className={clsx('auth-button', isSubmitDisabled && 'auth-button-disabled')}
              >
                <Text className="auth-button-text">Create Subscription</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

export default CreateSubscriptionModal
